/**
 * GestoJS
 * Gesture tracker module
 * TODO: Optimize for IOS. Now only works with Android
 *
 * @autor David Ruiz | david@daveruiz.net
 */

(function( GestoJS ) {

	"use strict"

	var Tracker = function( target ) {

		var tracker = this
		,	listeners = {}
		,	tracks = []
		,	touches = {}
		,	touchId = 0
		,	touchable = GestoJS.util.isTouchableDevice()
		,	idleTimerId

		/**
		 * Initialize tracker.
		 */
		var init = function() {

			if ( touchable ) {

				target.addEventListener( 'touchstart', startTouch )
				window.addEventListener( 'touchmove', moveTouch )
				window.addEventListener( 'touchend', endTouch )

			} else {

				// Desktop support
				target.addEventListener( 'mousedown', startTouch )
				window.addEventListener( 'mousemove', moveTouch )
				window.addEventListener( 'mouseup', endTouch )

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

			event.preventDefault()

			// Clear pending finish gesture timer
			if ( idleTimerId ) {
				clearTimeout( idleTimerId )
				idleTimerId = null
			}

			if ( !tracks.length ) {
				// Start gesture
				dispatch( GestoJS.event.ON_TRACK_START, { 'originalEvent' : event } )
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
						tracks[ touches[ touch.identifier ] ] = new GestoJS.core.Track( touches[ touch.identifier ] )
						tracks[ touches[ touch.identifier ] ].push( new GestoJS.core.Point( touch.pageX, touch.pageY ) )
					}
				}
			} else {
				tracks.push( new GestoJS.core.Track( tracks.length ) )
				tracks[ tracks.length - 1 ].push( new GestoJS.core.Point( event.pageX, event.pageY ) )
			}

			if ( !startFlag ) {
				// Not gesture start, dispatch as progress
				dispatch( GestoJS.event.ON_TRACK_PROGRESS, { 'tracks' : tracks, 'originalEvent' : event } )
			}

		}

		/**
		 * Register touch movements
		 * @param event			{event} touchmove/mousemove event
		 */
		var moveTouch = function( event ) {

			var i=0
			,   touch

			if ( tracks.length && !idleTimerId ) {
				event.preventDefault()

				if ( touchable ) {

					for (;i<event.touches.length;i++) {
						touch = event.touches[ i ]

						if (tracks[ touches[ touch.identifier ] ]) {
							tracks[ touches[ touch.identifier ] ].push( new GestoJS.core.Point( touch.pageX, touch.pageY ) )
						} else {
							// something went wrong
							GestoJS.err( "Fixme! Attemp to move unstarted touch !?")
						}
					}

				} else {
					tracks[ tracks.length - 1 ].push( new GestoJS.core.Point( event.pageX, event.pageY ) )
				}

				dispatch( GestoJS.event.ON_TRACK_PROGRESS, { 'tracks' : tracks, 'originalEvent' : event } )
			}
		}

		/**
		 * Finalize touch
		 * @param event			{event} touchend/mouseup event
		 */
		var endTouch = function( event ) {

			var currentTouches = {}
			,	i

			if ( tracks.length ) {

				event.preventDefault()

				if ( !touchable || !event.touches.length ) {
					// Start wait time before gesture end
					idleTimerId = setTimeout( finishGesture, tracker.endGestureDelay )
				}

				if ( touchable ) {

					// touch up but another touches enabled
					for (;i<event.touches.length;i++)
						currentTouches[ touches[ event.touches[ i ].identifier ] ] = true

					// End other touches
					for (i=0;i<tracks.length;i++) {
						if ( !currentTouches[ touches[ tracks[ i ].identifier ] ] ) {
							tracks[ i ].end()
							delete touches[ tracks[ i ].identifier ]
						}
					}

					dispatch( GestoJS.event.ON_TRACK_PROGRESS, { 'tracks' : tracks, 'originalEvent' : event } )
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
			var i

			// Order tracks by startTime
			tracks.sort( function(a, b) {
				if (a.startTime > b.startTime) return 1
				if (a.startTime < b.startTime) return -1
				return 0
			} )

			dispatch( GestoJS.event.ON_TRACK_COMPLETE, { 'tracks' : tracks, 'originalEvent' : null } );

			// Reset
			tracks = []
			touches = []
			touchId = 0
			idleTimerId = null
		}

		/**
		 * Dispatch an event
		 * @param eventType			{string} event type
		 * @param data				{object} event data
		 */
		var dispatch = function( eventType, data ) {
			var i=0
			,	event

			if ( !listeners[ eventType ] ) return

			// Create event
			event = new GestoJS.event.Event( eventType )
			event.tracks = data.tracks
			event.originalEvent = data.originalEvent

			for (;i<listeners[ eventType ].length;i++)
				listeners[ eventType ][ i ].method.call( this, event )
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

		/**
		 * Add event listener
		 * @param event			{string} event type
		 * @param callback		{function} callback
		 */
		this.addListener = function( event, callback ) {
			if (!listeners[ event ]) listeners[ event ] = []
			listeners[ event ].push({ 'method' : callback })
		}

		/**
		 * Remove event listener
		 * @param event			{string} event type
		 * @param callback		{function} callback
		 */
		this.removeListener = function( event, callback ) {
			var i
			if (!callback) {
				// Remove all callbacks
				delete listeners[ event ]
			} else {
				for (i=0;i<listeners[ event ];i++) {
					if (listeners[ event ][ i ].method === callback) {
						listeners[ event ].splice( i, 1 )
					}
				}
			}
		}

		// Initialize
		try {
			init()
		} catch( error ) {
			GestoJS.err( error.toString(), error )
		}

	}
	// Became public
	GestoJS.core.Tracker = Tracker

})( window.GestoJS )

