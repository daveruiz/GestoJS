/** GestoJS - Gesture analyzer module (TODO: Use workers) */

(function( GestoJS ) {

	"use strict"

	var Analyzer = function( instance ) {

		var analyzer = this
	
		/**
		 * Analyze several tracks and separate them in multiple time steps
		 * @param tracks		{array} Tracks to analyze
		 * @return				{array} Resultant steps
		 */
		var buildSteps = function( tracks ) {
			var steps = []
			,	activeTaps = []
			,	newActiveTaps
			,	time
			,	t = -1, i = 0, j

			// Assume tracks are ordered by startTime
			for (;i<tracks.length;i++) {

				time = tracks[ i ].startTime

				// Unregister ended taps
				newActiveTaps = []
				for (j=0; j<activeTaps.length; j++) {
					if (time < activeTaps[ j ].endTime) {
						newActiveTaps.push( activeTaps[ j ] )
					}
				}
				activeTaps = newActiveTaps

				// Create new step if not active taps
				if  (!activeTaps.length) {
					t++
					steps[ t ] = { 'time' : time, 'tracks' : [] }
				}

				// Register tap in current step
				steps[ t ].tracks.push( tracks[i] )
				activeTaps.push( tracks[i] )

			}

			return steps
		}

		/*
		 * Public methods
		 */

		/**
		 * Search gestures in a multiple tracks.
		 * @param tracks		{array} Tracks to analyze
		 * @param gestures		{array} Array of gestures to search
		 * @return				{array} Matches found
		 */
		this.analyze = function( tracks, gestureList ) {
			var gesture									// gesture reference object for analyzers
			,	ruleRe = /[a-z0-9_]+\([^\)]*\)/gi		// Re for rule matching
			,	matches = []							// array of matching gestures index
			,	steps = buildSteps( tracks )			// steps of tracks recorded
			,	step									// current step
			,	match									// match points counter of current gesture
			,	smatch									// match points counter of current step
			,	tmatch									// match points counter of current track
			,	gsteps									// current gesture steps
			,	gstr									// current gesture step string to eval
			,	nrules									// number of rules in current step
			,	gtracks									// tracks in current gesture step
			,	ngtracks								// total tracks in current gesture step
			,	ntracks									// total tracks in current recorded step
			,	track									// track counter

			,	gestures = gestureList.getSorted()		// sorted gesture array
			,	i, ii

			for (i=0,ii=gestures.length; i<ii; i++) {

				// current gsteps
				gsteps = gestures[ i ].gestureData

				if (gsteps.length !== steps.length) {
					// Number of steps doesn't match. Not matched gesture
					continue
				}

				match = 0	// reset total gesture match points

				// Check step by step if gesture matches
				for (step=0; step<gsteps.length; step++) {

					gstr = gsteps[ step ]	// current step in gesture

					// group rules in tracks
					gtracks = gstr.split( /&&/g )					// array of && splited rules
					ngtracks = gtracks.length						// total tracks in rules
					ntracks = steps[ step ].tracks.length			// total tracks in current step

					if ( ntracks !== ngtracks ) {
						// tracks recorder are less than tracks required by gestute.
						match = 0
						continue
					}

					// local step match counter
					smatch = 0

					// loop in tracks
					for (track=0; track<ntracks; track++) {

						nrules = 0

						// Gesture reference object for analyzers
						gesture = {
							'tracks'				: tracks
						,	'steps'					: steps
						,	'step'					: steps[ step ]
						,	'track'					: steps[ step ].tracks[ track ] // already referenced in analyzers by 'this'
						}

						// Replace each rule by match result
						gtracks[ track ] = gtracks[ track ].replace( ruleRe, function( analyzer ) {
							var fn, args, ruleMatch

							try {
								fn = analyzer.match( /^([^\(]+)/ )[1]				// rule name
								args = analyzer.match( /\(([^\)]*)/)[1].split(',')	// arguments
							} catch( err ) {
								GestoJS.err('Parsing error in "' + analyzer + '": '+err.toString())
								return 0
							}

							// analyzer value ( between 0 and 1 )
							if ( !GestoJS.analyzer[ fn ] ) {
								GestoJS.err('Undefined analyzer "' + fn + '"')
								return 0
							}

							ruleMatch = steps[ step ].tracks[ track ].analyze( fn, [ gesture ].concat( args ) )
							nrules++			// increment rule counter

							return ruleMatch
						})

						if ( !(tmatch = eval( gtracks[ track ] ) ) ) {
							// track eval not passed
							smatch = 0
							break
						}

						// add result to local step match counter
						smatch += tmatch / nrules

					}

					if (!smatch) {
						// single track doesn't match
						// so, cancel
						match = 0
						break
					}

					// add to gesture match points
					match += smatch / ntracks
				}

				// For match debugging
				//console.log( gestures[i].name, match / gsteps.length )

				// if match, save current gesture
				if (match) {
					// Save gesture
					matches.push({
						'name'		: gestures[ i ].name
					,	'points'	: match / gsteps.length
					})
				}

			}

			if ( matches.length ) {
				// Sort gestures by match points
				matches.sort(function(a,b) {
					if (a.points > b.points) return 1
					if (a.points < b.points) return -1
					return 0
				})

				return matches
			}

			// No matches found
			return null

		}
	}

	// Became public
	GestoJS.core.Analyzer = GestoJS.events.EventDispatcher.extend( Analyzer )

})( window.GestoJS )

