/** GestoJS - Utils module */

(function( GestoJS ) {

	"use strict"

	var Utils = {}

	/**
	 * Detect if device is touchable
	 * @return {boolean}
	 */
	Utils.isTouchableDevice = function() {
		return !!('ontouchstart' in window);
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
