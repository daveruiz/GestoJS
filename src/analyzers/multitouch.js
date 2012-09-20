/** GestoJS - Multitouch analyzers */

(function (GestoJS) {

	GestoJS.analyzer[ 'pinch' ] = function( gesture, zoom, parallelThreshold ) {
		var other, angleA, angleB, distA, distB, radA, radB

		if (gesture.step.tracks.length !== 2) return 0	// limit to gestures with 2 tracks

		parallelThreshold = parseFloat( parallelThreshold ) / 180 * Math.PI || Math.PI / 4 /* 45º */
		zoom = parseInt( zoom, 10 )
		other = gesture.step.tracks[ this === gesture.step.tracks[0] ? 1 : 0 ]

		angleA = this.points[ 0 ].angleTo( other.points[ 0 ] )
		angleB = this.points[ this.points.length - 1 ].angleTo( other.points[ other.points.length - 1 ] )
		distA = this.points[ 0 ].distanceTo( other.points[ 0 ] )
		distB = this.points[ this.points.length - 1 ].distanceTo( other.points[ other.points.length - 1 ] )
		radA = this.offset.angle()
		radB = other.offset.angle()

		return Math.abs( Math.sin( radA ) + Math.sin( radB )) < Math.PI / 4	// opposite
			&& Math.abs( Math.cos( radA )	+ Math.cos( radB )) < Math.PI / 4
			&& distA * zoom > distB * zoom							// in/out
			&& Math.abs( angleA - angleB ) <= parallelThreshold		// parallels
			 ? 1 : 0
	}

})( window.GestoJS )