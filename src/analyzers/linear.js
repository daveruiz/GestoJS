/** GestoJS - Linear movements analyzers */

(function (GestoJS) {

	GestoJS.analyzer[ 'swipe' ] = function( angle, threshold ) {
		var endAngle = this.endAngle
		angle = parseFloat( angle )
		threshold = parseFloat( threshold ) || 30

		if (endAngle < -135) endAngle += 360				// fix for swipe right
															// (-180 to 180 jump)

		return Math.abs( this.rotation ) < 30				// not curve
			&& this.length > 100							// min length
			&& endAngle >= angle-threshold					// defined angle
			&& endAngle <= angle+threshold
			 ? 1 - Math.abs( angle - this.endAngle ) / (threshold * 2) : 0
	}

})( window.GestoJS )