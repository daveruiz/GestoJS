/*
 * GestoJS
 * Single gesture track model
 *
 * @autor David Ruiz | david@daveruiz.net
 */

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
		this.angle = null
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
			this.length = this.getLength()
			this.endAngle = this.getAngle( Math.max( 0, this.points.length - 3 ), this.points.length - 1 )
			this.startAngle = this.getAngle( 0, Math.min( this.points.length - 1, 2 ) )
			this.offset = this.getOffset()
			this.middle = this.getMiddle()
			this.speed = this.length / this.duration * 1000 // px*s
			this.endSpeed = this.getSpeed()

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
		 * Test track with specified analyzer.
		 * @param analyzer		{string} Analyzer to test
		 * @param args			{array} Arguments to pass to the analyzer
		 * @return				{number} Similarity (between 0-1)
		 */
		this.analyze = function( analyzer, args ) {
			return GestoJs.analyzers[ analyzer ].apply( this, args )
		}

	}

	// Became public
	GestoJS.core.Track = Track

})( window.GestoJS )

