/** GestoJS - Point model */

(function( GestoJS ) {

	"use strict"

	function Handler( status ) {
		
		status = status || {}
			
		var handler = this
		,	target = null
		,	previous = null
		
		function relocate() {
			handler.update()
			previous = new GestoJS.core.Handler( handler )
			console.log( handler, previous )
		}
		
		this.update = function( tracks ) {
			if (target && !tracks) tracks = target.__getTracks() 
			if (!tracks || typeof tracks.slice !== 'function') {
				throw new Error( "First argument must be an array of Track instances" )
			}
			
			// clone track array
			tracks = tracks.slice()

			// Put at end active tracks
			tracks.sort( function( a, b ) {
				if (a.endTime && !b.endTime) return -1
				if (!a.endTime && b.endTime) return 1
				return 0
			})

			// Get only 2 last tracks
			tracks = tracks.slice( -2 )

			// Order by startTime
			tracks.sort( function( a, b ) {
				if (a.startTime > b.startTime) return 1
				return -1
			})

			if (tracks.length === 1) {
				this.x = (previous ? previous.x : 0) + tracks[0].offset.x
				this.y = (previous ? previous.y : 0) + tracks[0].offset.y
			} else if (tracks.length > 1) {
				this.x = (previous ? previous.x : 0) + (tracks[0].offset.x + tracks[1].offset.x) / 2
				this.y = (previous ? previous.y : 0) + (tracks[0].offset.y + tracks[1].offset.y) / 2

				this.scale = (previous ? previous.scale : 1)
							  * tracks[0].getPoint(-1).distanceTo( tracks[1].getPoint(-1) )
							  / tracks[0].getPoint(0).distanceTo( tracks[1].getPoint(0) )					

				this.rotation = (previous ? previous.rotation : 0)
								+ tracks[0].getPoint(-1).angleTo( tracks[1].getPoint(-1) ) 
								- tracks[0].getPoint(0).angleTo( tracks[1].getPoint(0) )
			}
			
		}
		
		this.listen = function( targetInstance ) {
			target = targetInstance
			target.addEventListener( GestoJS.events.ON_TRACK_COMPLETE, relocate )
		}
		
		this.reset = function( status ) {
			status = status || {}
			previous = null
			
			this.x = status.x || 0
			this.y = status.y || 0
			this.scale = status.scale || 1
			this.rotation = status.rotation || 0
		}	
		
		this.destroy = function() {
			// remove listeners
			target.removeEventListener( GestoJS.events.ON_TRACK_COMPLETE, relocate )
			this.reset()
		}
		
		this.reset( status )
	}
	
	// Became public
	GestoJS.core.Handler = Handler

})( window.GestoJS )

