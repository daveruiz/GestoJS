/**
 * GestoJS
 * Touch analyzers
 *
 * @autor David Ruiz | david@daveruiz.net
 */

(function (GestoJS) {

	GestoJS.analyzer['tap'] = function( minDuration, maxDuration ) {
		minDuration = parseInt( minDuration, 10 ) || 0
		maxDuration = parseInt( maxDuration, 10 ) || 200

		return this.length < 5							// max length
			&& this.duration >= minDuration				// defined duration
			&& this.duration <= maxDuration
			 ? 1 : 0
	}

	GestoJS.analyzer['longTap'] = function( minDuration ) {
		minDuration = parseInt( minDuration, 10 ) || 800

		return this.length < 5							// max legth
			&& this.duration >= minDuration				// defined duration
			 ? 1 : 0
	}

})( window.GestoJS )