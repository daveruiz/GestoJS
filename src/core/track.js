/** GestoJS - Single gesture track model */

(function( GestoJS ) {

	"use strict"

	var Track = function( id ) {

		var sumX = 0
		,	sumY = 0

		this.id = id
		this.points = []

		this.startTime = new Date().getTime()
		this.endTime = null

		this.duration = null
		this.speed = null
		this.endSpeed = null
		this.length = 0
		this.rotation = null
		this.startAngle = null
		this.endAngle = null
		this.offset = null
		this.middle = null

		/**
		 * Add point. Do not add to points array directly!
		 * @param point			{Object|GestoJS.core.Point} Point object
		 */
		this.push = function( point ) {
			this.points.push( point )

			sumX += point.x - this.points[0].x
			sumY += point.y - this.points[0].y

			if ( this.points.length > 1 )
				this.length += point.distanceTo( this.points[ this.points.length - 2 ])
		}

		/**
		 * Finalize track, doing some precalcs
		 */
		this.end = function() {

			if (this.endTime) return

			// Some ending calcs
			this.endTime = new Date().getTime()
			this.duration = this.endTime - this.startTime
			this.endAngle = this.getAngle( Math.max( 0, this.points.length - 4 ), this.points.length - 1 )
			this.startAngle = this.getAngle( 0, Math.min( this.points.length - 1, 3 ) )
			this.offset = this.getOffset()
			this.middle = this.getMiddle()
			this.speed = this.length / this.duration * 1000 // px*s
			this.endSpeed = this.getSpeed()

			// rotational angle calcs
			this.rotation = this.getRotation()

		}

		/**
		 * Get offset of last point and first point
		 * @return				{Object} Offset object
		 */
		this.getOffset = function() {
			return {
				'x' : this.points[ this.points.length - 1 ].x - this.points[ 0 ].x
			,	'y' : this.points[ this.points.length - 1 ].y - this.points[ 0 ].y
			}
		}

		/**
		 * Get middle point of track
		 * @return				{Object} Offset object
		 */
		this.getMiddle = function() {
			return {
				'x' : sumX / this.points.length
			,	'y' : sumY / this.points.length
			}
		}

		/**
		 * Get angle of defined track range. By default, use last 3 points
		 * to calculate outer angle
		 *
		 * @param start			{int} initial point
		 * @param end			{int} end point
		 * @return				{number} Angle in degrees
		 */
		this.getAngle = function( start, end ) {
			var i
			start = start !== undefined ? start : this.points.length - 3
			end = end !== undefined ? end : this.points.length - 1
			return this.points[ end ].angleTo( this.points[ start ] )
		}

		/**
		 * Get outer speed of the track
		 * @return				{number} Speed in pixels/second
		 */
		this.getSpeed = function() {
			return this.points[ this.points.length - 1 ].distanceTo( this.points[ Math.max( 0, this.points.length - 2 ) ] )
				   / ( this.points[ this.points.length - 1 ].time - this.points[ Math.max( 0, this.points.length - 2 ) ].time )
				   / 1000
		}

		/**
		 * Get rotational angle
		 * @return				{number} rotation
		 */
		this.getRotation = function() {
			var i, angle = 0, la, ca, loop = 0

			// no angle
			if (this.points.length <= 2) return 0

			la = this.points[1].angleTo( this.points[0] )

			for (i=2;i<this.points.length;i++) {
				ca = this.points[ i ].angleTo( this.points[ i-1 ] )

				// -180 to 180 fix
				// TODO: Improve this for
				// multiple 'loops' support
				if (ca < 0 && la > 0) { ca += 360 }
				if (ca > 0 && la < 0) { ca -= 360 }

				angle += ca - la
				la = ca
			}

			return angle
		}

		/**
		 * Test track with specified analyzer.
		 * @param analyzer		{string} Analyzer to test
		 * @param args			{array} Arguments to pass to the analyzer
		 * @return				{number} Similarity (between 0-1)
		 */
		this.analyze = function( analyzer, args ) {
			return GestoJS.analyzer[ analyzer ].apply( this, args )
		}

	}

	// Became public
	GestoJS.core.Track = Track

})( window.GestoJS )

