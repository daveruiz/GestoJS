/** GestoJS - Multitouch analyzers */

(function (GestoJS) {

	GestoJS.analyzer[ 'pinch' ] = function( gesture, zoom, angle, threshold ) {
		var other
		if (gesture.step.tracks.length !== 2) return 0	// limit to gestures with 2 tracks
		other = gesture.step.tracks[ this === gesture.step.tracks[0] ? 1 : 0 ]

		return this.offset.distanceTo( other.offset ) * zoom > 0
			&& this.rotation === - other.rotation
			 ? 1 : 0
	}

})( window.GestoJS )