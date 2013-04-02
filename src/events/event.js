/** GestoJS - Events and Event model */

(function( GestoJS ) {

	"use strict"

	var Events = GestoJS.events

	Events.ON_GESTURE = "onGesture"
	Events.ON_PROGRESS = "onProgress"

	Events.ON_TRACK_PROGRESS = "onTrackProgress"
	Events.ON_TRACK_START = "onTrackStart"
	Events.ON_TRACK_COMPLETE = "onTrackComplete"

	/**
	 * Event model
	 * @param type		{string} event type
	 */
	Events.Event = function( type ) {
		this.timestamp = new Date().getTime()
		this.type = type
		this.instance = null			// GestoJS instance
		this.originalEvent = null		// store mouse/touch/key event
		this.gestures = null			// gestures (used only by onGesture event)
		this.tracks = null				// tracks (used by all track events)
		this.sessionData = null			// Data available only in this gesture session
	}

	/**
	 * Analyzer
	 */
	Events.Event.prototype.analyzeGesture = function( gestures ) {
		var gestureList
		,	analyzer = this.instance.__getAnalyzer()

		if (gestures instanceof GestoJS.core.GestureList) {
			gestureList = gestures
		} else {
			gestureList = new GestoJS.core.GestureList()
			gestureList.add( gestures )
		}

		return analyzer.analyze( this.tracks, gestureList )
	}
	
	/**
	 * Handler
	 */
	Events.Event.prototype.getHandler = function() {
		var handler = new GestoJS.core.Handler()
		handler.listen( this.instance )
		
		return handler
	}

})( window.GestoJS )
