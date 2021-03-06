/** GestoJS - Linear movements analyzers */

(function (GestoJS) {

	GestoJS.analyzer[ 'line' ] = function( gesture, angle, threshold ) {
		angle = parseFloat( angle ) / 180 * Math.PI
		threshold = parseFloat( threshold ) / 180 * Math.PI || Math.PI / 6 /* 30º */

		return this.absoluteRotation < Math.PI / 2 /* 90º */	// not curve
			&& this.length > 5									// min length
			&& (this.endAngle >= angle-threshold && this.endAngle <= angle+threshold
				|| this.endAngle+(Math.PI*2) >= angle-threshold && this.endAngle+(Math.PI*2) <= angle+threshold)
			 ? 1 - Math.abs( angle - this.endAngle ) / (threshold * 2) : 0
	}

})( window.GestoJS )