/** GestoJS - Curve analyzers */

(function (GestoJS) {

	GestoJS.analyzer[ 'curve' ] = function( angle, threshold ) {
		var a
		angle = typeof angle !== 'undefined' ? parseFloat( angle ) : null
		threshold = parseFloat( threshold ) || 30

		return Math.abs( this.startAngle - this.endAngle ) > 5		// min angle
			&& ( angle === undefined || ( ( a = this.endAngle - this.startAngle ) <= angle + threshold && a >= angle - threshold ) ) // defined angle
			 ? 1 - Math.abs( a - angle ) / (threshold*2) : 0
	}

})( window.GestoJS )