/*
 * GestoJS
 * Gesture analyzer module
 * TODO: Use workers
 *
 * @autor David Ruiz | david@daveruiz.net
 */

(function( GestoJS ) {

	"use strict"

	var Analyzer = function() {

		var analyzer = this
		,	listeners = {}

		/**
		 * Dispatch an event. (Still unused, waiting for workers)
		 * @param event			{GestoJS.event.Event} Event to dispatch
		 */
		var dispatch = function( eventType, data ) {
			var i=0
			,	event

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
			,	ntracks
			,	gname
			,	gsteps
			,	gstr
			,	breakstep
			,	rule
			,	nrules

			for (gname in gestures) {

				// current gsteps
				gsteps = gestures[ gname ].gesture

				if (gsteps.length !== steps.length) {
					// Number of steps doesn't match. Not matched gesture
					continue
				}

				match = 0	// total gesture match points
				nrules = 0	// rules counter, for match points normalize

				// Check step by step if gesture matches
				for (step=0; step<gsteps.length; step++) {

					gstr = gsteps[ step ]	// current step in gesture
					rule=0					// current rule in step
					breakstep = false		// if step breaked by unmatched rule

					// if number of tracks expected are different abort current gesture, abort
					if ( gstr.match( ruleRe ).length !== steps[ step ].tracks.length ) {
						match = 0
						break
					}

					// Replace each rule by match result
					gstr = gstr.replace( ruleRe, function( analyzer ) {
						var fn = analyzer.match( /^([^\(]+)/ )[1]				// rule name
						,	args = analyzer.match( /\(([^\)]*)/)[1].split(',')	// arguments
						,	ruleMatch											// rule result

						// analyzer value ( between 0 and 1 )
						ruleMatch = GestoJS.analyzer[ fn ].apply( steps[ step ].tracks[ rule ], args )

						// if not match, mark to break
						if (!ruleMatch) breakstep = true

						nrules++	// increment rule counter
						rule++		// next rule

						return ruleMatch
					})

					// Evalue step
					if ( breakstep || !( cmatch = eval( gstr ) ) ) {
						// cancel gesture if no match
						match = 0;
						break
					}

					// global gesture match counter
					match += cmatch
				}

				// if match, save current gesture
				if (match) {
					// Save gesture
					matches.push({
						'name'		: gname
					,	'points'	: match / nrules
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

