/** GestoJS - Events and Event model */

(function( GestoJS ) {

	"use strict"

	/**
	 * Gesture model
	 * @param data		{string} gesture data
	 * @param priority	{int}
	 */
	var Gesture = function( name, data, priority ) {
		this.name = name
		this.priority = priority || 0

		this.gestureData = []

		if (typeof data === 'string') this.gestureData.push( data )
		if (data instanceof Array) this.gestureData = data
	}

	// Became public
	GestoJS.core.Gesture = Gesture

})( window.GestoJS )
