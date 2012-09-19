/** GestoJS - Single gesture track model */

(function( GestoJS ) {

	"use strict"

	var Track = function( id ) {

		var track = this
		,	sumX = 0
		,	sumY = 0
		,	lastRot = null
		,	lastAng = null
		,	loops = 0

		var updateCalcs = function() {
			var curRot, curAng
			,	prevPoint = track.points.length > 1 ? track.points[ Math.max( 0, track.points.length - 2 ) ] : null
			,	lastPoint = track.points[ track.points.length - 1 ]

			// Speed
			track.speed = track.length / track.duration * 1000 // px*s

			// Offset
			track.offset = track.getOffset()

			// Middle point
			sumX += lastPoint.x
			sumY += lastPoint.y
			track.middle = track.getMiddle()

			if ( prevPoint ) {
				// Length
				track.length += lastPoint.distanceTo( prevPoint )

				// Rotation
				curAng = lastPoint.angleTo( prevPoint )

				if (lastAng > 90 && curAng < -90) loops++; // detect clockwise loop
				if (lastAng < -90 && curAng > 90) loops--; // detect anticlockwise loop
				curRot = curAng + loops*360
				if ( lastRot !== null ) track.rotation += curRot - lastRot

				lastRot = curRot
				lastAng = curAng

				// Loops (offset corrected)
				track.loops = Math.floor( track.rotation / 360 ) + ( track.rotation < 0 ? 1 : 0 )

				// Angle
				track.endAngle = track.getAngle( Math.max( 0, track.points.length - 4 ), track.points.length - 1 )
				track.startAngle = track.getAngle( 0, Math.min( track.points.length - 1, 3 ) )

				// Speed
				track.endSpeed = track.getSpeed()
			}
		}

		/* Public vars */

		this.id = id
		this.points = []

		this.startTime = new Date().getTime()
		this.endTime = null

		this.duration = 0
		this.speed = 0
		this.endSpeed = 0
		this.length = 0
		this.rotation = 0
		this.startAngle = 0
		this.endAngle = 0
		this.offset = null
		this.middle = null
		this.loops = 0

		/* Public methods */

		/**
		 * Add point. Do not add to points array directly!
		 * @param point			{Object|GestoJS.core.Point} Point object
		 */
		this.push = function( point ) {
			// Add point
			this.points.push( point )
			updateCalcs()
		}

		/**
		 * Finalize track, doing some precalcs
		 */
		this.end = function() {

			if (this.endTime) return

			// Some ending calcs
			this.endTime = new Date().getTime()
			this.duration = this.endTime - this.startTime

			console.log( this.rotation, this.loops )

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
			return GestoJS.analyzer[ analyzer ].apply( this, args )
		}

	}

	// Became public
	GestoJS.core.Track = Track

})( window.GestoJS )

