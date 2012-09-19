
/** GestoJS - Utils module */

(function( GestoJS ) {

	"use strict"

	var Utils = {}

	/**
	 * Detect if device is touchable
	 * @return {boolean}
	 */
	Utils.isTouchableDevice = function() {
		return !!('ontouchstart' in window);
	}

	/**
	 * Return if something is a function
	 * @return {boolean}
	 */
	Utils.isFunction = function( fn ) {
		return !!(typeof fn === 'function')
	}


	// Became public
	GestoJS.util = Utils

})( window.GestoJS )

/** GestoJS - Gesture analyzer module (TODO: Use workers) */

(function( GestoJS ) {

	"use strict"

	var Analyzer = function() {

		var analyzer = this
		,	listeners = {}

		/**
		 * Dispatch an event. (Still unused, waiting for workers)
		 * @param eventType		{GestoJS.event.Event} Event to dispatch
		 */
		var dispatch = function( eventType, data ) {
			var i=0, event

			if ( !listeners[ eventType ] ) return

			// Create event
			event = new GestoJS.event.Event( eventType )

			for (;i<listeners[ eventType ].length;i++)
				listeners[ eventType ][ i ].method.call( this, event, listeners[ event ][ i ].data )
		}

		/**
		 * Analyze several tracks and separate them in multiple time steps
		 * @param tracks		{array} Tracks to analyze
		 * @return				{array} Resultant steps
		 */
		var buildSteps = function( tracks ) {
			var steps = []
			,	activeTaps = []
			,	newActiveTaps
			,	time
			,	t = -1, i = 0, j

			// Assume tracks are ordered by startTime
			for (;i<tracks.length;i++) {

				time = tracks[ i ].startTime

				// Unregister ended taps
				newActiveTaps = []
				for (j=0; j<activeTaps.length; j++) {
					if (time < activeTaps[ j ].endTime) {
						newActiveTaps.push( activeTaps[ j ] )
					}
				}
				activeTaps = newActiveTaps

				// Create new step if not active taps
				if  (!activeTaps.length) {
					t++
					steps[ t ] = { 'time' : time, 'tracks' : [] }
				}

				// Register tap in current step
				steps[ t ].tracks.push( tracks[i] )
				activeTaps.push( tracks[i] )

			}

			return steps
		}

		/*
		 * Public methods
		 */

		/**
		 * Search gestures in a multiple tracks.
		 * @param tracks		{array} Tracks to analyze
		 * @param gestures		{array} Array of gestures to search
		 * @return				{array} Matches found
		 */
		this.analyze = function( tracks, gestures ) {
			var t = 0
			,	ruleRe = /[a-z0-9]+\([^\)]*\)/gi
			,	matches = []
			,	match
			,	cmatch
			,	step
			,	steps = buildSteps( tracks )
			,	gname
			,	gsteps
			,	gstr
			,	breakstep
			,	nrules
			,	gtracks
			,	ngtracks
			,	tr

			for (gname in gestures) {

				// current gsteps
				gsteps = gestures[ gname ].gesture

				if (gsteps.length !== steps.length) {
					// Number of steps doesn't match. Not matched gesture
					continue
				}

				match = 0	// total gesture match points

				// Check step by step if gesture matches
				for (step=0; step<gsteps.length; step++) {

					gstr = gsteps[ step ]	// current step in gesture
					breakstep = false		// if step breaked by unmatched rule

					// group rules in tracks
					gtracks = gstr.split( /&&/g )
					ngtracks = gtracks.length

					// if number of tracks expected are different abort current gesture, abort
					if ( ngtracks !== steps[ step ].tracks.length ) {
						match = 0
						break
					}

					// local step match counter
					cmatch = 0

					// loop in tracks
					for (tr=0; tr<ngtracks; tr++) {

						nrules = 0

						// Replace each rule by match result
						gtracks[ tr ] = gtracks[ tr ].replace( ruleRe, function( analyzer ) {
							var fn, args, ruleMatch

							try {
								fn = analyzer.match( /^([^\(]+)/ )[1]				// rule name
								args = analyzer.match( /\(([^\)]*)/)[1].split(',')	// arguments
							} catch( err ) {
								GestoJS.err('Parsing error in "' + analyzer + '"')
								return 0
							}

							// analyzer value ( between 0 and 1 )
							ruleMatch = steps[ step ].tracks[ tr ].analyze( fn, args )
							nrules++			// increment rule counter

							return ruleMatch
						})

						// add result to lcoal step match counter
						cmatch += eval( gtracks[ tr ] )

					}

					if (!cmatch) {
						// single track doesn't match
						// so, cancel
						match = 0
						break
					}

					// add to gesture match points
					match += cmatch / nrules
				}

				// if match, save current gesture
				if (match) {
					// Save gesture
					matches.push({
						'name'		: gname
					,	'points'	: match / ngtracks
					})
				}

			}

			if ( matches.length ) {
				// Sort gestures by match points
				matches.sort(function(a,b) {
					if (a.points > b.points) return 1
					if (a.points < b.points) return -1
					return 0
				})

				return matches
			}

			// No matches found
			return null

		}

		/**
		 * Add an event listener. (Still unused, waiting for workers)
		 * @param event			{string} Event type
		 * @param callback		{function}
		 */
		this.addListener = function( event, callback ) {
			if (!listeners[ event ]) listeners[ event ] = []
			listeners[ event ].push({
				't' : new Date().getTime()
			,	'f' : callback
			})
		}

		/**
		 * Remove event listener. (Still unused, waiting for workers)
		 * @param event			{string} Event type
		 * @param callback		{function}
		 */
		this.removeListener = function( event, callback ) {
			var i
			if (!callback) {
				// Remove all callbacks
				delete listeners[ event ]
			} else {
				for (i=0;i<listeners[ event ];i++) {
					if (listeners[ event ][ i ].f === callback) {
						listeners[ event ].splice( i, 1 )
					}
				}
			}
		}

	}

	// Became public
	GestoJS.core.Analyzer = Analyzer

})( window.GestoJS )


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


/** GestoJS - Events and Event model */

(function( GestoJS ) {

	"use strict"

	var Events = {}

	Events.ON_GESTURE = "onGesture"

	Events.ON_TRACK_PROGRESS = "onTrackProgress"
	Events.ON_TRACK_START = "onTrackStart"
	Events.ON_TRACK_COMPLETE = "onTrackComplete"

	/**
	 * Event model
	 * @param type		{string} event type
	 */
	Events.Event = function( type ) {
		this.timestamp = new Date().getTime()
		this.type = type
		this.originalEvent = null		// store mouse/touch/key event
		this.gestures = null			// gestures (used only by onGesture event)
		this.tracks = null				// tracks (used by all track events)
	}

	// Became public
	GestoJS.event = Events

})( window.GestoJS )

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
		 * Calculates angle to other point
		 * @param point			{Object|GestoJS.core.Point} Point object
		 * @return				{number} Angle in degrees
		 */
		this.angleTo = function( point ) {
			return Math.atan2( point.y - this.y, point.x - this.x ) / Math.PI * 180
		}

	}

	// Became public
	GestoJS.core.Point = Point

})( window.GestoJS )


/** GestoJS - Gesture tracker module */

(function( GestoJS ) {

	"use strict"

	var Tracker = function( target ) {

		var tracker = this
		,	listeners = {}
		,	tracks = []
		,	touches = {}
		,	touchId = 0
		,	touchable = GestoJS.util.isTouchableDevice()
		,	idleTimerId

		/**
		 * Initialize tracker.
		 */
		var init = function() {

			if ( touchable ) {

				target.addEventListener( 'touchstart', startTouch, false )
				window.addEventListener( 'touchmove', moveTouch, false )
				window.addEventListener( 'touchend', endTouch, false )

			} else {

				// Desktop support
				target.addEventListener( 'mousedown', startTouch, false )
				window.addEventListener( 'mousemove', moveTouch, false )
				window.addEventListener( 'mouseup', endTouch, false )

			}

		}

		/**
		 * Initialize touch tracking
		 * @param event			{event} touchstart/mousedown event
		 */
		var startTouch = function( event ) {

			var i=0
			,	touch
			,	startFlag

			event.preventDefault()

			// Clear pending finish gesture timer
			if ( idleTimerId ) {
				clearTimeout( idleTimerId )
				idleTimerId = null
			}

			if ( !tracks.length ) {
				// Start gesture
				dispatch( GestoJS.event.ON_TRACK_START, { 'originalEvent' : event } )
				startFlag = true
			}

			if ( touchable ) {

				for (;i<event.touches.length;i++) {
					touch = event.touches[ i ]

				    // If no touch active with current identifier
					// create new touch
				    if ( touches[ touch.identifier ] === undefined ) {

						touches[ touch.identifier ] = touchId++

						// New track
						tracks[ touches[ touch.identifier ] ] = new GestoJS.core.Track( touch.identifier )
						tracks[ touches[ touch.identifier ] ].push( new GestoJS.core.Point( touch.pageX, touch.pageY ) )
					}
				}
			} else {
				tracks.push( new GestoJS.core.Track( tracks.length ) )
				tracks[ tracks.length - 1 ].push( new GestoJS.core.Point( event.pageX, event.pageY ) )
			}

			if ( !startFlag ) {
				// Not gesture start, dispatch as progress
				dispatch( GestoJS.event.ON_TRACK_PROGRESS, { 'tracks' : tracks, 'originalEvent' : event } )
			}

		}

		/**
		 * Register touch movements
		 * @param event			{event} touchmove/mousemove event
		 */
		var moveTouch = function( event ) {

			var i=0
			,   touch

			if ( tracks.length && !idleTimerId ) {
				event.preventDefault()

				if ( touchable ) {

					for (;i<event.touches.length;i++) {
						touch = event.touches[ i ]

						if (tracks[ touches[ touch.identifier ] ]) {
							tracks[ touches[ touch.identifier ] ].push( new GestoJS.core.Point( touch.pageX, touch.pageY ) )
						} else {
							// something went wrong
							GestoJS.err( "Fixme! Attemp to move unstarted touch !?")
						}
					}

				} else {
					tracks[ tracks.length - 1 ].push( new GestoJS.core.Point( event.pageX, event.pageY ) )
				}

				dispatch( GestoJS.event.ON_TRACK_PROGRESS, { 'tracks' : tracks, 'originalEvent' : event } )
			}
		}

		/**
		 * Finalize touch
		 * @param event			{event} touchend/mouseup event
		 */
		var endTouch = function( event ) {

			var currentTouches = {}
			,	i=0

			if ( tracks.length ) {

				event.preventDefault()

				if ( !touchable || !event.touches.length ) {
					// Start wait time before gesture end
					idleTimerId = setTimeout( finishGesture, tracker.endGestureDelay )
				}

				if ( touchable ) {

					// touch up but another touches enabled
					for (;i<event.touches.length;i++)
						currentTouches[ event.touches[ i ].identifier ] = true

					// End other touches
					for (i=0;i<tracks.length;i++) {
						if ( !currentTouches[ touches[ tracks[ i ].id ] ] ) {
							tracks[ i ].end()
							delete touches[ tracks[ i ].id ]
						}
					}

					dispatch( GestoJS.event.ON_TRACK_PROGRESS, { 'tracks' : tracks, 'originalEvent' : event } )
				} else {

					// End current tracks
					for (i=0;i<tracks.length;i++) tracks[ i ].end()

				}

			}

		}

		/**
		 * Finalize gesture tracking and send onGesture event
		 */
		var finishGesture = function() {
			var i

			// Order tracks by startTime
			tracks.sort( function(a, b) {
				if (a.startTime > b.startTime) return 1
				if (a.startTime < b.startTime) return -1
				return 0
			} )

			dispatch( GestoJS.event.ON_TRACK_COMPLETE, { 'tracks' : tracks, 'originalEvent' : null } );

			// Reset
			tracks = []
			touches = {}
			touchId = 0
			idleTimerId = null
		}

		/**
		 * Dispatch an event
		 * @param eventType			{string} event type
		 * @param data				{object} event data
		 */
		var dispatch = function( eventType, data ) {
			var i=0
			,	event

			if ( !listeners[ eventType ] ) return

			// Create event
			event = new GestoJS.event.Event( eventType )
			event.tracks = data.tracks
			event.originalEvent = data.originalEvent

			for (;i<listeners[ eventType ].length;i++)
				listeners[ eventType ][ i ].method.call( this, event )
		}

		/*
		 * Public vars
		 */

		/**
		 * Delay between end all touches and end of gesture
		 */
		this.endGestureDelay = 120

		/*
		 * Public methods
		 */

		/**
		 * Add event listener
		 * @param event			{string} event type
		 * @param callback		{function} callback
		 */
		this.addListener = function( event, callback ) {
			if (!listeners[ event ]) listeners[ event ] = []
			listeners[ event ].push({ 'method' : callback })
		}

		/**
		 * Remove event listener
		 * @param event			{string} event type
		 * @param callback		{function} callback
		 */
		this.removeListener = function( event, callback ) {
			var i
			if (!callback) {
				// Remove all callbacks
				delete listeners[ event ]
			} else {
				for (i=0;i<listeners[ event ];i++) {
					if (listeners[ event ][ i ].method === callback) {
						listeners[ event ].splice( i, 1 )
					}
				}
			}
		}

		// Initialize
		try {
			init()
		} catch( error ) {
			GestoJS.err( error.toString(), error )
		}

	}
	// Became public
	GestoJS.core.Tracker = Tracker

})( window.GestoJS )


/** GestoJS - Base class */

(function() {

	"use strict"

	var GestoJS = function( target, autoload ) {

		var	instance = this
		,	initialized	= false
		,	gestures = {}
		,	listeners = {}
		,	tracker
		,	analyzer

		/**
		 * Initialize instance
		 * @param target		{Element} An element where start gestures. Default 'window'
		 */
		var init = function( target ) {
			var i

			if (initialized) {
				GestoJS.warn( 'Already running!' )
				return
			}

			// Initialize gesture recorder
			tracker = new GestoJS.core.Tracker( target )

			// Bubbling
			tracker.addListener( GestoJS.event.ON_TRACK_START, dispatch )
			tracker.addListener( GestoJS.event.ON_TRACK_PROGRESS, dispatch )
			tracker.addListener( GestoJS.event.ON_TRACK_COMPLETE, dispatch )

			// Analizer
			tracker.addListener( GestoJS.event.ON_TRACK_COMPLETE, analyze )

			// Initialize gesture analyzer
			analyzer = new GestoJS.core.Analyzer()

			// Autoload all gestures
			if( autoload ) for (i in GestoJS.gesture) instance.addGesture( i )

		}

		/**
		 * Analyze a tracker event
		 * @param event			{GestoJS.event.Event} Event with tracks data
		 */
		var analyze = function( event ) {
			var matches, ev
			if (!instance.enabled) return
			matches = analyzer.analyze( event.tracks, gestures )

			if (matches && matches.length) {
				ev = new GestoJS.event.Event( GestoJS.event.ON_GESTURE )
				ev.gestures = matches

				dispatch( ev )
			}
		}

		/**
		 * Dispatch an event
		 * @param event			{GestoJS.event.Event} Event to dispatch
		 */
		var dispatch = function( event ) {
			var i

			if (!listeners[ event.type ]) return;

			for (i=0; i<listeners[ event.type ].length; i++)
				listeners[ event.type ][ i ].call( instance, event )
		}

		/* Public vars and methods */

		/**
		 * Instance enabled?
		 */
		this.enabled = true

		/**
		 * Add gesture to check list
		 * @param name			{string} Identifier name for gesture
		 * @param gestureArray	{array} Array of gesture strings. Each array is a gesture step.
		 * @param priority		{number} Default 0. Higher, high priority. Lower, low priority (still unused)
		 */
		this.addGesture = function( name, gestureArray, priority ) {
			GestoJS.log( 'Listening gesture ', name )
			gestures[ name ] = {
				'priority'	: priority || 0
			,	'gesture'	: gestureArray || GestoJS.gesture[ name ]
			}
		}

		/**
		 * Remove gesture from check list
		 * @param name			{string}
		 */
		this.removeGesture = function( name ) {
			delete gestures[ name ]
		}

		/**
		 * Add an event listener
		 * @param type			{string}
		 * @param callback		{string}
		 */
		this.addEventListener = function( type, callback ) {
			if (!listeners[ type ]) listeners[ type ] = []
			listeners[ type ].push( callback )
		}

		/**
		 * Remove event listener
		 * @param type			{string}
		 * @param callback		{string}
		 */
		this.removeEventListener = function( type, callback ) {
			var i, newList;
			if (!listeners[ type ]) return;
			for (i=0; i<listeners[ type ].length; i++)
				if (listeners[ type ][ i ] !== callback) newList.push( listeners[ type ][ i ] )

			listeners[ type ] = newList
		}

		/* Initialize */
		init( target || window )

	}

    /* Static containers */

    GestoJS.core = {}
    GestoJS.util = {}
    GestoJS.event = {}
    GestoJS.analyzer = {}
    GestoJS.gesture = {}

	/* Static vars */

	GestoJS.NAME = "GestoJS"
	GestoJS.debug = true

	/* Static methods */

	/**
	 * Display an error
	 * @param error				{mixed} the error
	 */
	GestoJS.err = function( error ) {
		var args = [ '['+GestoJS.NAME+']' ], i = 0
		if (GestoJS.debug && GestoJS.util.isFunction( window.console.error )) {
			for (;i<arguments.length;i++) args.push( arguments[i] )
			window.console.error.call( window.console, args.join(' ') )
		}
	}

	/**
	 * Display a message
	 * @param message			{mixed} the error
	 */
	GestoJS.log = function( /* many */ ) {
		var args = [ '['+GestoJS.NAME+']' ], i = 0
		if (GestoJS.debug && GestoJS.util.isFunction( window.console.log )) {
			for (;i<arguments.length;i++) args.push( arguments[i] )
			window.console.log.call( window.console, args.join(' ') )
		}
	}

	/**
	 * Display a warning
	 * @param message			{mixed} the error
	 */
	GestoJS.warn = function( message ) {
		var args = [ '['+GestoJS.NAME+']' ], i = 0
		if (GestoJS.debug && typeof GestoJS.util.isFunction( window.console )) {
			for (;i<arguments.length;i++) args.push( arguments[i] )
			window.console.warn.call( window.console, args.join(' ') )
		}
	}

	// Became public
	window.GestoJS = GestoJS

})()


/** GestoJS - Touch analyzers */

(function (GestoJS) {

	GestoJS.analyzer['tap'] = function( minDuration, maxDuration ) {
		minDuration = parseInt( minDuration, 10 ) || 0
		maxDuration = parseInt( maxDuration, 10 ) || 400

		return this.length < 5							// max length
			&& this.duration >= minDuration				// defined duration
			&& this.duration <= maxDuration
			 ? 1 : 0
	}

	GestoJS.analyzer['longTap'] = function( minDuration ) {
		minDuration = parseInt( minDuration, 10 ) || 400

		return this.length < 5							// max legth
			&& this.duration >= minDuration				// defined duration
			 ? 1 : 0
	}

})( window.GestoJS )
/** GestoJS - Curve analyzers */

(function (GestoJS) {

	GestoJS.analyzer[ 'arc' ] = function( angle, threshold ) {
		var a
		angle = angle !== undefined ? parseFloat( angle ) : null
		threshold = parseFloat( threshold ) || 30

		return this.rotation >= angle-threshold
			&& this.rotation <= angle+threshold
			&& this.length > 20
			 ? 1 - Math.abs(angle - this.rotation) / (threshold*2)
			 : 0
	}

	GestoJS.analyzer[ 'circle' ] = function( threshold ) {
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
/** GestoJS - Linear movements analyzers */

(function (GestoJS) {

	GestoJS.analyzer[ 'line' ] = function( angle, threshold ) {
		angle = parseFloat( angle )
		threshold = parseFloat( threshold ) || 30

		return Math.abs( this.rotation ) < 30				// not curve
			&& this.length > 100							// min length
			&& (this.endAngle >= angle-threshold && this.endAngle <= angle+threshold
				|| this.endAngle+360 >= angle-threshold && this.endAngle+360 <= angle+threshold)
			 ? 1 - Math.abs( angle - this.endAngle ) / (threshold * 2) : 0
	}

})( window.GestoJS )
/** GestoJS - Some predefined gestures */

(function (GestoJS) {

	GestoJS.gesture[ 'tap' ]				= [ 'tap()' ]
	GestoJS.gesture[ 'twoTap' ]				= [ 'tap()', 'tap()' ]
	GestoJS.gesture[ 'longTap' ]			= [ 'longTap()' ]
	GestoJS.gesture[ 'twoTapLong']			= [ 'tap()', 'longTap()' ]
	GestoJS.gesture[ 'doubleTap' ]			= [ 'tap() && tap()' ]
	GestoJS.gesture[ 'doubleLongTap' ]		= [ 'longTap() + longTap()' ]
	GestoJS.gesture[ 'twoDoubleTap' ]		= [ 'tap() && tap()', 'tap() && tap()' ]

	GestoJS.gesture[ 'swipeLeft' ]			= [ 'line(0)' ]
	GestoJS.gesture[ 'swipeRight' ]			= [ 'line(180)' ]
	GestoJS.gesture[ 'swipeUp' ]			= [ 'line(90)' ]
	GestoJS.gesture[ 'swipeDown' ]			= [ 'line(-90)' ]

	GestoJS.gesture[ 'doubleSwipeLeft' ]	= [ 'line(0) && line(0)' ]
	GestoJS.gesture[ 'doubleSwipeRight' ]	= [ 'line(180) && line(180)' ]
	GestoJS.gesture[ 'doubleSwipeUp' ]		= [ 'line(90) && line(90)' ]
	GestoJS.gesture[ 'doubleSwipeDown' ]	= [ 'line(-90) && line(-90)' ]

	//GestoJS.gesture[ 'zoomIn' ]				= [ 'var a=line(0) && var b=line(180)' ]

	GestoJS.gesture[ 'circle' ]				= [ 'arc(400,90) * circle() || arc(-400,90) * circle()' ]
	GestoJS.gesture[ 'circleRight' ]		= [ 'arc(400,90) * circle()' ]
	GestoJS.gesture[ 'circleLeft' ]			= [ 'arc(-400,90) * circle()' ]


})( window.GestoJS )
