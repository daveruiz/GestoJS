/** GestoJS - Base class */

(function() {

	"use strict"

	var GestoJS = function( target, autoload ) {

		var	instance = this
		,	initialized	= false
		,	gestures = new GestoJS.core.GestureList()
		,	listeners = {}
		,	tracker
		,	analyzer

		/**
		 * Initialize instance
		 * @param target		{Element} An element where start gestures. Default 'window'
		 */
		var init = function( target ) {
			var i

			if (initialized) {
				GestoJS.warn( 'Already running!' )
				return
			}

			// Initialize gesture recorder
			tracker = new GestoJS.core.Tracker( target )

			// Fake bubbling
			tracker.addListener( GestoJS.event.ON_TRACK_START, dispatch )
			tracker.addListener( GestoJS.event.ON_TRACK_COMPLETE, dispatch )
			tracker.addListener( GestoJS.event.ON_TRACK_PROGRESS, dispatch )
			tracker.addListener( GestoJS.event.ON_TRACK_COMPLETE, dispatch )

			// Gesture progress
			tracker.addListener( GestoJS.event.ON_TRACK_PROGRESS, progress )

			// Gesture completed
			tracker.addListener( GestoJS.event.ON_TRACK_COMPLETE, analyze )

			// Initialize gesture analyzer
			analyzer = new GestoJS.core.Analyzer()

			// Autoload all gestures
			if( autoload ) for (i in GestoJS.gesture) instance.addGesture( i )

		}

		/**
		 * Analyze a tracker event on completed gesture
		 * @param event			{GestoJS.event.Event} Event with tracks data
		 */
		var analyze = function( event ) {
			var matches, ev
			if (!instance.enabled) return
			matches = analyzer.analyze( event.tracks, gestures )

			if (matches && matches.length) {
				ev = new GestoJS.event.Event( GestoJS.event.ON_GESTURE )
				ev.gestures = matches
				dispatch( ev )
			}
		}

		/**
		 * Complete progress event
		 * @param event			{GestoJS.event.Event} Event with tracks data
		 */
		var progress = function( event ) {
			var ev = new GestoJS.event.Event( GestoJS.event.ON_PROGRESS )
				ev.tracks = event.tracks
				ev.analyzer = analyzer

			dispatch( ev )
		}

		/**
		 * Dispatch an event
		 * @param event			{GestoJS.event.Event} Event to dispatch
		 */
		var dispatch = function( event ) {
			var i

			if (!listeners[ event.type ]) return;

			for (i=0; i<listeners[ event.type ].length; i++)
				listeners[ event.type ][ i ].call( instance, event )
		}

		/* Public vars and methods */

		/**
		 * Instance enabled?
		 */
		this.enabled = true

		/**
		 * Add gesture to check list
		 * @param name			{string} Identifier name for gesture
		 * @param gestureArray	{array} Array of gesture strings. Each array is a gesture step.
		 * @param priority		{number} Default 0. Higher, high priority. Lower, low priority (still unused)
		 */
		this.addGesture = function( name, gestureArray, priority ) {
			GestoJS.log( 'Listening gesture ', name )
			gestures.add( new GestoJS.core.Gesture( name, gestureArray || GestoJS.gesture[ name ] ), priority )
		}

		/**
		 * Remove gesture from check list
		 * @param name			{string}
		 */
		this.removeGesture = function( name ) {
			gestures.remove( name )
		}

		/**
		 * Add an event listener
		 * @param type			{string}
		 * @param callback		{string}
		 */
		this.addEventListener = function( type, callback ) {
			if (!listeners[ type ]) listeners[ type ] = []
			listeners[ type ].push( callback )
		}

		/**
		 * Remove event listener
		 * @param type			{string}
		 * @param callback		{string}
		 */
		this.removeEventListener = function( type, callback ) {
			var i, newList;
			if (!listeners[ type ]) return;
			for (i=0; i<listeners[ type ].length; i++)
				if (listeners[ type ][ i ] !== callback) newList.push( listeners[ type ][ i ] )

			listeners[ type ] = newList
		}

		/* Initialize */
		init( target || window )

	}

    /* Static containers */

    GestoJS.core = {}
    GestoJS.util = {}
    GestoJS.event = {}
    GestoJS.analyzer = {}
    GestoJS.gesture = {}

	/* Static vars */

	GestoJS.NAME = "GestoJS"
	GestoJS.debug = 1

	/* Static methods */

	/**
	 * Display an error
	 * @param error				{mixed} the error
	 */
	GestoJS.err = function( error ) {
		var args = [ '['+GestoJS.NAME+']' ], i = 0
		if (GestoJS.debug && GestoJS.util.isFunction( window.console.error )) {
			for (;i<arguments.length;i++) args.push( arguments[i] )
			window.console.error.call( window.console, args.join(' ') )
		}
	}

	/**
	 * Display a message
	 * @param message			{mixed} the error
	 */
	GestoJS.log = function( /* many */ ) {
		var args = [ '['+GestoJS.NAME+']' ], i = 0
		if (GestoJS.debug && GestoJS.util.isFunction( window.console.log )) {
			for (;i<arguments.length;i++) args.push( arguments[i] )
			window.console.log.call( window.console, args.join(' ') )
		}
	}

	/**
	 * Display a warning
	 * @param message			{mixed} the error
	 */
	GestoJS.warn = function( message ) {
		var args = [ '['+GestoJS.NAME+']' ], i = 0
		if (GestoJS.debug && typeof GestoJS.util.isFunction( window.console )) {
			for (;i<arguments.length;i++) args.push( arguments[i] )
			window.console.warn.call( window.console, args.join(' ') )
		}
	}

	// Became public
	window.GestoJS = GestoJS

})()

