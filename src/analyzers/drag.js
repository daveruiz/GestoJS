/**
 * GestoJS
 * Drag movements analyzers
 *
 * @autor David Ruiz | david@daveruiz.net
 */

(function (GestoJS) {

	GestoJS.analyzer[ 'swipe' ] = function( angle, threshold ) {
		angle = parseFloat( angle )
		threshold = parseFloat( threshold ) || 30

		return !GestoJS.analyzer.curve.call( this )			// not curve
			&& this.length > 10								// min length
			&& this.endAngle >= angle-threshold				// defined angle
			&& this.endAngle <= angle+threshold
			 ? 1 - Math.abs( angle - this.endAngle ) / (threshold * 2) : 0
	}

	GestoJS.analyzer[ 'throw' ] = function( angle, threshold, minSpeed ) {
		angle = parseFloat( angle )
		threshold = parseFloat( threshold )
		minSpeed = parseFloat( minSpeed ) || 5 // px/s

		return !GestoJS.analyzer.curve.call( this )			// not curve
			&& this.length > 10								// min length
			&& this.endAngle >= angle - threshold			// defined angle
			&& this.endAngle <= angle + threshold
			&& this.endSpeed >= minSpeed					// end speed
			 ? 1 - Math.abs( angle - this.endAngle ) / (threshold * 2) : 0
	}

})( window.GestoJS )