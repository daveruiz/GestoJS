/** GestoJS - Gesture analyzer module (TODO: Use workers) */

(function( GestoJS ) {

	"use strict"

	var Analyzer = function() {

		var analyzer = this
		,	listeners = {}

		/**
		 * Dispatch an event. (Still unused, waiting for workers)
		 * @param eventType		{GestoJS.event.Event} Event to dispatch
		 */
		var dispatch = function( eventType, data ) {
			var i=0, event

			if ( !listeners[ eventType ] ) return

			// Create event
			event = new GestoJS.event.Event( eventType )

			for (;i<listeners[ eventType ].length;i++)
				listeners[ eventType ][ i ].method.call( this, event, listeners[ event ][ i ].data )
		}

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
		this.analyze = function( tracks, gestures ) {
			var t = 0
			,	ruleRe = /[a-z0-9]+\([^\)]*\)/gi
			,	matches = []
			,	match
			,	cmatch
			,	step
			,	steps = buildSteps( tracks )
			,	gname
			,	gsteps
			,	gstr
			,	breakstep
			,	nrules
			,	gtracks
			,	ngtracks
			,	tr

			for (gname in gestures) {

				// current gsteps
				gsteps = gestures[ gname ].gesture

				if (gsteps.length !== steps.length) {
					// Number of steps doesn't match. Not matched gesture
					continue
				}

				match = 0	// total gesture match points

				// Check step by step if gesture matches
				for (step=0; step<gsteps.length; step++) {

					gstr = gsteps[ step ]	// current step in gesture
					breakstep = false		// if step breaked by unmatched rule

					// group rules in tracks
					gtracks = gstr.split( /&&/g )
					ngtracks = gtracks.length

					// if number of tracks expected are different abort current gesture, abort
					if ( ngtracks !== steps[ step ].tracks.length ) {
						match = 0
						break
					}

					// local step match counter
					cmatch = 0

					// loop in tracks
					for (tr=0; tr<ngtracks; tr++) {

						nrules = 0

						// Replace each rule by match result
						gtracks[ tr ] = gtracks[ tr ].replace( ruleRe, function( analyzer ) {
							var fn, args, ruleMatch

							try {
								fn = analyzer.match( /^([^\(]+)/ )[1]				// rule name
								args = analyzer.match( /\(([^\)]*)/)[1].split(',')	// arguments
							} catch( err ) {
								GestoJS.err('Parsing error in "' + analyzer + '"')
								return 0
							}

							// analyzer value ( between 0 and 1 )
							ruleMatch = steps[ step ].tracks[ tr ].analyze( fn, args )
							nrules++			// increment rule counter

							return ruleMatch
						})

						// add result to lcoal step match counter
						cmatch += eval( gtracks[ tr ] )

					}

					if (!cmatch) {
						// single track doesn't match
						// so, cancel
						match = 0
						break
					}

					// add to gesture match points
					match += cmatch / nrules
				}

				// if match, save current gesture
				if (match) {
					// Save gesture
					matches.push({
						'name'		: gname
					,	'points'	: match / ngtracks
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

		/**
		 * Add an event listener. (Still unused, waiting for workers)
		 * @param event			{string} Event type
		 * @param callback		{function}
		 */
		this.addListener = function( event, callback ) {
			if (!listeners[ event ]) listeners[ event ] = []
			listeners[ event ].push({
				't' : new Date().getTime()
			,	'f' : callback
			})
		}

		/**
		 * Remove event listener. (Still unused, waiting for workers)
		 * @param event			{string} Event type
		 * @param callback		{function}
		 */
		this.removeListener = function( event, callback ) {
			var i
			if (!callback) {
				// Remove all callbacks
				delete listeners[ event ]
			} else {
				for (i=0;i<listeners[ event ];i++) {
					if (listeners[ event ][ i ].f === callback) {
						listeners[ event ].splice( i, 1 )
					}
				}
			}
		}

	}

	// Became public
	GestoJS.core.Analyzer = Analyzer

})( window.GestoJS )

