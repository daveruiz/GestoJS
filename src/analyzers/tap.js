/** GestoJS - Touch analyzers */

(function (GestoJS) {

	GestoJS.analyzer['press'] = function( gesture ) {
		// Allways true
		return 1
	}

	GestoJS.analyzer['tap'] = function( gesture, minDuration, maxDuration ) {
		minDuration = parseInt( minDuration, 10 ) || 0
		maxDuration = parseInt( maxDuration, 10 ) || 400

		return this.length < 5							// max length
			&& this.duration >= minDuration				// defined duration
			&& this.duration < maxDuration
			 ? 1 : 0
	}

	GestoJS.analyzer['longTap'] = function( gesture, minDuration ) {
		minDuration = parseInt( minDuration, 10 ) || 400

		return this.length < 5							// max legth
			&& this.duration >= minDuration				// defined duration
			 ? 1 : 0
	}

})( window.GestoJS )