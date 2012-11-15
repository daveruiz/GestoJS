/** GestoJS - Events and Event model */

(function( GestoJS ) {

	"use strict"

	/**
	 * GestureList model
	 */
	var GestureList = function() {
		this.list = {}
	}

	/**
	 * Add single or multiple gestures to the list
	 * @param gestures	{mixed} single gesture data string, gesture array or gesture names
	 * @param priority	{number} priority
	 */
	GestureList.prototype.add = function( gestures, priority ) {
		var i,ii

		// Add single gesture instance
		if (gestures instanceof GestoJS.core.Gesture) {
			gestures.priority = priority || gestures.priority || 0
			this.list[ gestures.name ] = gestures
		}

		// Allow multiple gestures in single string, separated by comma
		if (typeof gestures === 'string') {
			gestures = gestures.split(',')
		}

		if (gestures instanceof Array) {
			for (i=0,ii=gestures.length;i<ii;i++) {
				if ( gestures[i] instanceof GestoJS.core.Gesture ) {
					// Add gesture instance
					// Update priority
					gestures[i].priority = priority || gestures[i].priority || 0
					// Add directly to list object
					this.list[ gestures[i].name ] = gestures[i]
				} else if ( typeof gestures[i] === 'string' && GestoJS.gesture[ gestures[i] ] ) {
					// Create predefined gesture and add to list object
					this.list[ gestures[i] ] = new GestoJS.core.Gesture( gestures[i], GestoJS.gesture[ gestures ], priority )
				} else {
					// Create custom gesture and add to list object
					this.list[ 'gesture'+(i+1)	 ] = new GestoJS.core.Gesture( 'gesture'+(i+1), gestures[i].toString(), priority )
				}
			}
		}
	}

	/**
	 * Remove gesture from list
	 * @param name	{string} gesture name
	 */
	GestureList.prototype.remove = function( name ) {
		delete this.list[ name ]
	}

	/**
	 * Return sorted gesture arrays
	 * @return {array}
	 */
	GestureList.prototype.getSorted = function() {
		var sorted = [], i, ii

		// Copy to array
		for (i in this.list) sorted.push( this.list[i] )

		// Sort by priority
		sorted.sort( function( a, b ) {
			if (a.priority > b.priority) return 1
			if (b.priority > a.priority) return -1
			return 0
		})

		return sorted
	}

	// Became public
	GestoJS.core.GestureList = GestureList

})( window.GestoJS )
