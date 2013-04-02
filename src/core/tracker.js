/** GestoJS - Gesture tracker module */

(function( GestoJS ) {

	"use strict"

	var Tracker = function( instance, target ) {

		var tracker = this
		,	tracks = []
		,	touches = {}
		,	touchId = 0
		,	touchable = GestoJS.util.isTouchableDevice()
		,	idleTimerId
		,	currentSession

		/**
		 * Initialize tracker.
		 */
		var init = function() {

			if ( touchable ) {

				target.addEventListener( 'touchstart', startTouch, false )
				window.addEventListener( 'touchmove', moveTouch, false )
				window.addEventListener( 'touchend', endTouch, false )

			} else {

				// Desktop support
				target.addEventListener( 'mousedown', startTouch, false )
				window.addEventListener( 'mousemove', moveTouch, false )
				window.addEventListener( 'mouseup', endTouch, false )

			}

		}

		/**
		 * Initialize touch tracking
		 * @param event			{event} touchstart/mousedown event
		 */
		var startTouch = function( event ) {

			var i=0
			,	touch
			,	startFlag
			,	gestoEvent

			event.preventDefault()

			// Clear pending finish gesture timer
			if ( idleTimerId ) {
				clearTimeout( idleTimerId )
				idleTimerId = null
			}

			if ( !tracks.length ) {
				// Start gesture
				currentSession = {}
				gestoEvent = new GestoJS.events.Event( GestoJS.events.ON_TRACK_START )
				gestoEvent.instance = instance
				gestoEvent.originalEvent = event
				gestoEvent.sessionData = currentSession
				tracker.dispatch( gestoEvent )
				startFlag = true
			}

			if ( touchable ) {

				for (;i<event.touches.length;i++) {
					touch = event.touches[ i ]

				    // If no touch active with current identifier
					// create new touch
				    if ( touches[ touch.identifier ] === undefined ) {

						touches[ touch.identifier ] = touchId++

						// New track
						tracks[ touches[ touch.identifier ] ] = new GestoJS.core.Track( touch.identifier )
						tracks[ touches[ touch.identifier ] ].push( new GestoJS.core.Point( touch.pageX, touch.pageY ) )
					}
				}
			} else {
				tracks.push( new GestoJS.core.Track( tracks.length ) )
				tracks[ tracks.length - 1 ].push( new GestoJS.core.Point( event.pageX, event.pageY ) )
			}

			if ( !startFlag ) {
				// Not gesture start, dispatch as progress
				gestoEvent = new GestoJS.events.Event( GestoJS.events.ON_TRACK_PROGRESS )
				gestoEvent.instance = instance
				gestoEvent.tracks = tracks
				gestoEvent.originalEvent = event
				gestoEvent.sessionData = currentSession
				tracker.dispatch( gestoEvent )
			}

		}

		/**
		 * Register touch movements
		 * @param event			{event} touchmove/mousemove event
		 */
		var moveTouch = function( event ) {

			var i=0
			,   touch
			,	point
			,	gestoEvent

			if ( tracks.length && !idleTimerId ) {
				event.preventDefault()

				if ( touchable ) {

					for (;i<event.touches.length;i++) {
						touch = event.touches[ i ]
						point = new GestoJS.core.Point( touch.pageX, touch.pageY )

						if (tracks[ touches[ touch.identifier ] ]) {
							tracks[ touches[ touch.identifier ] ].push( point )
						} else {
							// something went wrong
							GestoJS.err( "Fixme! Attemp to move unstarted touch !?")
						}
					}

				} else {
					point = new GestoJS.core.Point( event.pageX, event.pageY )
					
					tracks[ tracks.length - 1 ].push( point )
				}

				gestoEvent = new GestoJS.events.Event( GestoJS.events.ON_TRACK_PROGRESS )
				gestoEvent.instance = instance
				gestoEvent.tracks = tracks
				gestoEvent.originalEvent = event
				gestoEvent.sessionData = currentSession
				tracker.dispatch( gestoEvent )
			}
		}

		/**
		 * Finalize touch
		 * @param event			{event} touchend/mouseup event
		 */
		var endTouch = function( event ) {

			var currentTouches = {}
			,	i=0
			,	gestoEvent

			if ( tracks.length ) {

				event.preventDefault()

				if ( !touchable || !event.touches.length ) {
					// Start wait time before gesture end
					idleTimerId = setTimeout( finishGesture, tracker.endGestureDelay )
				}

				if ( touchable ) {

					// touch up but another touches enabled
					for (;i<event.touches.length;i++)
						currentTouches[ event.touches[ i ].identifier ] = true

					// End other touches
					for (i=0;i<tracks.length;i++) {
						if ( !currentTouches[ touches[ tracks[ i ].id ] ] ) {
							tracks[ i ].end()
							delete touches[ tracks[ i ].id ]
						}
					}

					gestoEvent = new GestoJS.events.Event( GestoJS.events.ON_TRACK_PROGRESS )
					gestoEvent.instance = instance
					gestoEvent.tracks = tracks
					gestoEvent.originalEvent = event
					gestoEvent.sessionData = currentSession
					tracker.dispatch( gestoEvent )
					
				} else {

					// End current tracks
					for (i=0;i<tracks.length;i++) tracks[ i ].end()

				}

			}

		}

		/**
		 * Finalize gesture tracking and send onGesture event
		 */
		var finishGesture = function() {
			var gestoEvent

			// Order tracks by startTime
			tracks.sort( function(a, b) {
				if (a.startTime > b.startTime) return 1
				if (a.startTime < b.startTime) return -1
				return 0
			} )

			gestoEvent = new GestoJS.events.Event( GestoJS.events.ON_TRACK_COMPLETE )
			gestoEvent.instance = instance
			gestoEvent.tracks = tracks
			gestoEvent.sessionData = currentSession
			tracker.dispatch( gestoEvent )

			// Reset
			tracks = []
			touches = {}
			touchId = 0
			idleTimerId = null
		}
		
		/*
		 * Public vars
		 */

		/**
		 * Delay between end all touches and end of gesture
		 */
		this.endGestureDelay = 120

		/*
		 * Public methods
		 */

		this.getTracks = function() {
			return tracks.slice()
		}

		// Initialize
		try {
			init()
		} catch( error ) {
			GestoJS.err( error.toString(), error )
		}

	}
	// Became public
	GestoJS.core.Tracker = GestoJS.events.EventDispatcher.extend( Tracker )

})( window.GestoJS )

