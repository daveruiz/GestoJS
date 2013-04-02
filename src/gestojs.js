/** GestoJS - Base class */

(function() {

	"use strict"

	var GestoJS = function( target, autoload ) {

		var	instance = this
		,	initialized	= false
		,	gestures = new GestoJS.core.GestureList()
		,	tracker
		,	analyzer
		,	handlers = {}

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
			tracker = new GestoJS.core.Tracker( instance, target )

			// Fake bubbling
			tracker.addEventListener( GestoJS.events.ON_TRACK_START, instance.dispatch )
			tracker.addEventListener( GestoJS.events.ON_TRACK_COMPLETE, instance.dispatch )
			tracker.addEventListener( GestoJS.events.ON_TRACK_PROGRESS, instance.dispatch )

			// Gesture progress
			tracker.addEventListener( GestoJS.events.ON_TRACK_PROGRESS, progress )

			// Gesture completed
			tracker.addEventListener( GestoJS.events.ON_TRACK_COMPLETE, analyze )

			// Initialize gesture analyzer
			analyzer = new GestoJS.core.Analyzer( instance )

			// Autoload all gestures
			if( autoload ) for (i in GestoJS.gesture) instance.addGesture( i )

		}

		/**
		 * Analyze a tracker event on completed gesture
		 * @param event			{GestoJS.events.Event} Event with tracks data
		 */
		var analyze = function( event ) {
			var matches, ev
			if (!instance.enabled) return
			matches = analyzer.analyze( event.tracks, gestures )

			if (matches && matches.length) {
				ev = new GestoJS.events.Event( GestoJS.events.ON_GESTURE )
				ev.instance = instance
				ev.sessionData = event.sessionData
				ev.gestures = matches
				instance.dispatch( ev )
			}
		}

		/**
		 * Complete progress event
		 * @param event			{GestoJS.events.Event} Event with tracks data
		 */
		var progress = function( event ) {
			var ev = new GestoJS.events.Event( GestoJS.events.ON_PROGRESS )
				ev.instance = instance
				ev.sessionData = event.sessionData
				ev.tracks = event.tracks
				ev.activeTracks = event.activeTracks
				ev.analyzer = analyzer

			instance.dispatch( ev )
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
		 * return current tracks (internal)
		 */
		this.__getTracks = function() {
			return tracker.getTracks()
		}	
		
		/**
		 * return analyzer instance (internal)
		 */
		this.__getAnalyzer = function() {
			return analyzer
		}
		
		// Create dispatcher for events
		var dispatcher = new GestoJS.events.EventDispatcher()
		this.addEventListener = dispatcher.addEventListener
		this.removeEventListener = dispatcher.removeEventListener
		this.dispatch = dispatcher.dispatch

		/* Initialize */
		init( target || window )

	}

    /* Static containers */

    GestoJS.core = {}
    GestoJS.util = {}
    GestoJS.events = {}
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
	
	/**
	 * Simple class extender
	 */
	GestoJS.core.Base = function() {}
	GestoJS.core.Base.extend = function( Clas ) {
		var result, i, baseClas = this
				
		// super
		result = function SomeClass() {
			baseClas.apply( this, arguments )
			Clas.apply( this, arguments )
		}
		
		result._parentClass = baseClas
		result._originalClass = Clas
				
		// Extend prototype
		for (i in baseClas.prototype) {
			if (baseClas.prototype.hasOwnProperty(i)) {
				result.prototype[i] = baseClas.prototype[i]
			}
		}
		for (i in Clas.prototype) {
			if (Clas.prototype.hasOwnProperty(i)) {
				result.prototype[i] = Clas.prototype[i]
			}
		}
		
		// Extend static
		for (i in baseClas) {
			if (baseClas.hasOwnProperty(i)) {
				result[i] = baseClas[i]
			}
		}
		for (i in Clas) {
			if (Clas.hasOwnProperty(i)) {
				result[i] = Clas[i]
			}
		}
		
		return result;
	}
	
	window.GestoJS = GestoJS

})()

