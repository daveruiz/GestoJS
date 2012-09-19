/** GestoJS - Linear movements analyzers */

(function (GestoJS) {

	GestoJS.analyzer[ 'line' ] = function( angle, threshold ) {
		angle = parseFloat( angle )
		threshold = parseFloat( threshold ) || 30

		return Math.abs( this.rotation ) < 30				// not curve
			&& this.length > 100							// min length
			&& (this.endAngle >= angle-threshold && this.endAngle <= angle+threshold
				|| this.endAngle+360 >= angle-threshold && this.endAngle+360 <= angle+threshold)
			 ? 1 - Math.abs( angle - this.endAngle ) / (threshold * 2) : 0
	}

})( window.GestoJS )