/** GestoJS - Curve analyzers */

(function (GestoJS) {

	GestoJS.analyzer[ 'arc' ] = function( gesture, angle, threshold ) {
		var a
		angle = parseFloat( angle ) / 180 * Math.PI
		threshold = parseFloat( threshold ) / 180 * Math.PI || Math.PI / 6 /* 30º */

		return this.rotation >= angle-threshold
			&& this.rotation <= angle+threshold
			&& this.length > 20
			 ? 1 - Math.abs(angle - this.rotation) / (threshold*2) : 0
	}

	GestoJS.analyzer[ 'circle' ] = function( gesture, threshold ) {
		var i, ii, maxDistance = 0, minDistance = Number.MAX_VALUE
		threshold = threshold || .8
		for (i=0,ii=this.points.length;i<ii;i++) {
			maxDistance = Math.max( maxDistance, this.points[i].distanceTo( this.middle ) )
			minDistance = Math.min( minDistance, this.points[i].distanceTo( this.middle ) )
		}

		return Math.max( 0, threshold - (maxDistance - minDistance) / maxDistance )
	}

	GestoJS.analyzer[ 'loop' ] = function( count ) {
		return Math.abs( this.loops ) === ( count || 1 ) ? 1 : 0
	}

})( window.GestoJS )