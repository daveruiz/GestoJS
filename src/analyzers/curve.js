/** GestoJS - Curve analyzers */

(function (GestoJS) {

	GestoJS.analyzer[ 'curve' ] = function( angle, threshold ) {
		var a
		angle = typeof angle !== 'undefined' ? parseFloat( angle ) : null
		threshold = parseFloat( threshold ) || 30

		return this.rotation >= angle-threshold
			&& this.rotation <= angle+threshold
			&& this.length > 20
			 ? 1 - Math.abs(angle - this.rotation) / (threshold*2)
			 : 0
	}

})( window.GestoJS )