/** GestoJS - Utils module */

(function( GestoJS ) {

	"use strict"

	var Utils = {}

	/**
	 * Detect if device is touchable
	 * @return {boolean}
	 */
	Utils.isTouchableDevice = function() {
		// Patch for lastest desktop Chrome. It throws false positive
		if ( navigator.userAgent.indexOf("Chrome")>-1 &&
			 !( navigator.userAgent.indexOf("iOS")>-1 || navigator.userAgent.indexOf("Android")>-1 )) return false

		return ('ontouchstart' in window) ||
			   (window.DocumentTouch && document instanceof DocumentTouch)
	}

	/**
	 * Return if something is a function
	 * @return {boolean}
	 */
	Utils.isFunction = function( fn ) {
		return !!(typeof fn === 'function')
	}


	// Became public
	GestoJS.util = Utils

})( window.GestoJS )
