
/** GestoJS - Utils module */

(function( GestoJS ) {

	"use strict"

	var Utils = {}

	/**
	 * Get type of event. (still unused)
	 * @return			{string} type
	 */
	Utils.getEventType = function( eventString ) {
		return eventString.split('.').shift()
	}

	/**
	 * Get namespace of event. (still unused)
	 * @return			{string} namespace
	 */
	Utils.getEventNamespace = function( eventString ) {
		return eventString.split('.').length > 1 ? eventString.split('.').slice(1).join('.') : ''
	}

	/**
	 * Detect if device is touchable
	 * @return			{boolean}
	 */
	Utils.isTouchableDevice = function() {
		return !!('ontouchstart' in window);
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
			,	ntracks
			,	gname
			,	gsteps
			,	gstr
			,	breakstep
			,	rule
			,	nrules

			for (gname in gestures) {

				// current gsteps
				gsteps = gestures[ gname ].gesture

				if (gsteps.length !== steps.length) {
					// Number of steps doesn't match. Not matched gesture
					continue
				}

				match = 0	// total gesture match points
				nrules = 0	// rules counter, for match points normalize

				// Check step by step if gesture matches
				for (step=0; step<gsteps.length; step++) {

					gstr = gsteps[ step ]	// current step in gesture
					rule=0					// current rule in step
					breakstep = false		// if step breaked by unmatched rule

					// if number of tracks expected are different abort current gesture, abort
					if ( gstr.match( ruleRe ).length !== steps[ step ].tracks.length ) {
						match = 0
						break
					}

					// Replace each rule by match result
					gstr = gstr.replace( ruleRe, function( analyzer ) {
						var fn = analyzer.match( /^([^\(]+)/ )[1]				// rule name
						,	args = analyzer.match( /\(([^\)]*)/)[1].split(',')	// arguments
						,	ruleMatch											// rule result

						// analyzer value ( between 0 and 1 )
						ruleMatch = steps[ step ].tracks[ rule ].analyze( fn, args )

						// if not match, mark to break
						if (!ruleMatch) breakstep = true

						nrules++	// increment rule counter
						rule++		// next rule

						return ruleMatch
					})

					// Evalue step
					if ( breakstep || !( cmatch = eval( gstr ) ) ) {
						// cancel gesture if no match
						match = 0;
						break
					}

					// global gesture match counter
					match += cmatch
				}

				// if match, save current gesture
				if (match) {
					// Save gesture
					matches.push({
						'name'		: gname
					,	'points'	: match / nrules
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

	GestoJS.debug = true

	/* Static methods */

	/**
	 * Display an error
	 * @param error				{mixed} the error
	 */
	GestoJS.err = function( error ) {
		var args = [ '[GestoJS]' ], i = 0
		if (GestoJS.debug && typeof window.console.error === 'function') {
			for (;i<arguments.length;i++) args.push( arguments[i] )
			window.console.error.call( window.console, args.join(' ') )
		}
	}

	/**
	 * Display a message
	 * @param message			{mixed} the error
	 */
	GestoJS.log = function( /* many */ ) {
		var args = [ '[GestoJS]' ], i = 0
		if (GestoJS.debug && typeof window.console.log === 'function') {
			for (;i<arguments.length;i++) args.push( arguments[i] )
			window.console.log.call( window.console, args.join(' ') )
		}
	}

	/**
	 * Display a warning
	 * @param message			{mixed} the error
	 */
	GestoJS.warn = function( message ) {
		var args = [ '[GestoJS]' ], i = 0
		if (GestoJS.debug && typeof window.console.warn === 'function') {
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
/** GestoJS - Linear movements analyzers */

(function (GestoJS) {

	GestoJS.analyzer[ 'swipe' ] = function( angle, threshold ) {
		var endAngle = this.endAngle
		angle = parseFloat( angle )
		threshold = parseFloat( threshold ) || 30

		if (endAngle < -135) endAngle += 360				// fix for swipe right
															// (-180 to 180 jump)

		return Math.abs( this.rotation ) < 30				// not curve
			&& this.length > 100							// min length
			&& endAngle >= angle-threshold					// defined angle
			&& endAngle <= angle+threshold
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

	GestoJS.gesture[ 'swipeLeft' ]			= [ 'swipe(0)' ]
	GestoJS.gesture[ 'swipeRight' ]			= [ 'swipe(180)' ]
	GestoJS.gesture[ 'swipeUp' ]			= [ 'swipe(90)' ]
	GestoJS.gesture[ 'swipeDown' ]			= [ 'swipe(-90)' ]

	GestoJS.gesture[ 'doubleSwipeLeft' ]	= [ 'swipe(0) && swipe(0)' ]
	GestoJS.gesture[ 'doubleSwipeRight' ]	= [ 'swipe(180) && swipe(180)' ]
	GestoJS.gesture[ 'doubleSwipeUp' ]		= [ 'swipe(90) && swipe(90)' ]
	GestoJS.gesture[ 'doubleSwipeDown' ]	= [ 'swipe(-90) && swipe(-90)' ]

	GestoJS.gesture[ 'circle' ]				= [ 'curve(360,40)' ]

})( window.GestoJS )
