/*
 * GestoJS
 * Utils module
 *
 * @autor David Ruiz | david@daveruiz.net
 */

(function( GestoJS ) {

	"use strict"

	var Utils = {}

	/**
	 * Get type of event. (still unused)
	 * @return			{string} type
	 */
	Utils.getEventType = function( eventString ) {
		return eventString.split('.').shift()
	}

	/**
	 * Get namespace of event. (still unused)
	 * @return			{string} namespace
	 */
	Utils.getEventNamespace = function( eventString ) {
		return eventString.split('.').length > 1 ? eventString.split('.').slice(1).join('.') : ''
	}

	/**
	 * Detect if device is touchable
	 * @return			{boolean}
	 */
	Utils.isTouchableDevice = function() {
		return !!('ontouchstart' in window);
	}

	// Became public
	GestoJS.util = Utils

})( window.GestoJS )
