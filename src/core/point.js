/** GestoJS - Point model */

(function( GestoJS ) {

	"use strict"

	var Point = function( x, y, size, force ) {

		this.time = new Date().getTime()
		this.x = x
		this.y = y
		this.size = size || 1
		this.force = force || 1

		/**
		 * Calculates distance to other point
		 * @param point			{Object|GestoJS.core.Point} Point object
		 * @return				{number} Distance pixels
		 */
		this.distanceTo = function( point ) {
			return Math.sqrt( (point.x - this.x)*(point.x - this.x) + (point.y - this.y)*(point.y - this.y) )
		}

		/**
		 * Calculates angle with other point
		 * @param point			{Object|GestoJS.core.Point} Point object
		 * @return				{number} Angle in degrees
		 */
		this.angleTo = function( point ) {
			return Math.atan2( point.y - this.y, point.x - this.x )
		}

		/**
		 * Calculates angle with axis
		 * @return				{number} Angle in degrees
		 */
		this.angle = function() {
			return (new GestoJS.core.Point(0,0)).angleTo( this )
		}

		/**
		 * Return inverted point
		 * @return				{GestoJS.core.Point} 
		 */
		this.invert = function() {
			return new GestoJS.core.Point( -this.x, -this.y, size, force )
		}

	}
	
	/**
	 * (Static) Get middle point
	 * @param				{GestoJS.core.Point} a point
	 * @return				{GestoJS.core.Point} middle point
	 */
	Point.middle = function() {
		var i
		,	points = arguments
		,	sumX = points[0].x
		,	sumY = points[0].y
		
		for (i=1; i<points.length; i++) {
			sumX += points[i].x
			sumY += points[i].y
		}
		
		return new GestoJS.core.Point( sumX/points.length, sumY/points.length )
	}

	// Became public
	GestoJS.core.Point = Point

})( window.GestoJS )

