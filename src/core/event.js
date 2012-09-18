/** GestoJS - Events and Event model */

(function( GestoJS ) {

	"use strict"

	var Events = {}

	Events.ON_GESTURE = "onGesture"

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
		this.originalEvent = null		// store mouse/touch/key event
		this.gestures = null			// gestures (used only by onGesture event)
		this.tracks = null				// tracks (used by all track events)
	}

	// Became public
	GestoJS.event = Events

})( window.GestoJS )
