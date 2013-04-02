/** GestoJS - Point model */

(function( GestoJS ) {

	"use strict"

	var EventDispatcher = function() {
		
		var listeners = {}
		
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
		
		/**
		 * Dispatch an event
		 * @param event			{GestoJS.events.Event} Event to dispatch
		 */
		this.dispatch = function( event ) {
			var i
			if (!listeners[ event.type ]) return;

			for (i=0; i<listeners[ event.type ].length; i++)
				listeners[ event.type ][ i ].call( this, event )	
		}
		
	}
	
	// Became public
	GestoJS.events.EventDispatcher = GestoJS.core.Base.extend( EventDispatcher )

})( window.GestoJS )

