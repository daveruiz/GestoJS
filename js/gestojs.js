
/** GestoJS - Utils module */

(function( GestoJS ) {

	"use strict"

	var Utils = {}

	/**
	 * Detect if device is touchable
	 * @return {boolean}
	 */
	Utils.isTouchableDevice = function() {
		// Patch for lastest desktop Chrome. It throws false positive
		if ( navigator.userAgent.indexOf("Chrome")>-1 &&
			 !( navigator.userAgent.indexOf("iOS")>-1 || navigator.userAgent.indexOf("Android")>-1 )) return false

		return ('ontouchstart' in window) ||
			   (window.DocumentTouch && document instanceof DocumentTouch)
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
		this.analyze = function( tracks, gestureList ) {
			var gesture									// gesture reference object for analyzers
			,	ruleRe = /[a-z0-9]+\([^\)]*\)/gi		// Re for rule matching
			,	matches = []							// array of matching gestures index
			,	steps = buildSteps( tracks )			// steps of tracks recorded
			,	step									// current step
			,	match									// match points counter of current gesture
			,	smatch									// match points counter of current step
			,	tmatch									// match points counter of current track
			,	gsteps									// current gesture steps
			,	gstr									// current gesture step string to eval
			,	nrules									// number of rules in current step
			,	gtracks									// tracks in current gesture step
			,	ngtracks								// total tracks in current gesture step
			,	ntracks									// total tracks in current recorded step
			,	track, trl								// track counter

			,	gestures = gestureList.getSorted()		// sorted gesture array
			,	i, ii

			for (i=0,ii=gestures.length; i<ii; i++) {

				// current gsteps
				gsteps = gestures[ i ].gestureData

				if (gsteps.length !== steps.length) {
					// Number of steps doesn't match. Not matched gesture
					continue
				}

				match = 0	// reset total gesture match points

				// Check step by step if gesture matches
				for (step=0; step<gsteps.length; step++) {

					gstr = gsteps[ step ]	// current step in gesture

					// group rules in tracks
					gtracks = gstr.split( /&&/g )					// array of && splited rules
					ngtracks = gtracks.length						// total tracks in rules
					ntracks = steps[ step ].tracks.length			// total tracks in current step

					if ( ntracks !== ngtracks ) {
						// tracks recorder are less than tracks required by gestute.
						match = 0
						continue
					}

					// local step match counter
					smatch = 0

					// loop in tracks
					for (track=0; track<ntracks; track++) {

						nrules = 0

						// Gesture reference object for analyzers
						gesture = {
							'tracks'				: tracks
						,	'steps'					: steps
						,	'step'					: steps[ step ]
						,	'track'					: steps[ step ].tracks[ track ] // already referenced in analyzers by 'this'
						}

						// Replace each rule by match result
						gtracks[ track ] = gtracks[ track ].replace( ruleRe, function( analyzer ) {
							var fn, args, ruleMatch

							try {
								fn = analyzer.match( /^([^\(]+)/ )[1]				// rule name
								args = analyzer.match( /\(([^\)]*)/)[1].split(',')	// arguments
							} catch( err ) {
								GestoJS.err('Parsing error in "' + analyzer + '": '+err.toString())
								return 0
							}

							// analyzer value ( between 0 and 1 )
							if ( !GestoJS.analyzer[ fn ] ) {
								GestoJS.err('Undefined analyzer "' + fn + '"')
								return 0
							}

							ruleMatch = steps[ step ].tracks[ track ].analyze( fn, [ gesture ].concat( args ) )
							nrules++			// increment rule counter

							return ruleMatch
						})

						if ( !(tmatch = eval( gtracks[ track ] ) ) ) {
							// track eval not passed
							smatch = 0
							break
						}

						// add result to local step match counter
						smatch += tmatch / nrules

					}

					if (!smatch) {
						// single track doesn't match
						// so, cancel
						match = 0
						break
					}

					// add to gesture match points
					match += smatch / ntracks
				}

				// For match debugging
				//console.log( gestures[i].name, match / gsteps.length )

				// if match, save current gesture
				if (match) {
					// Save gesture
					matches.push({
						'name'		: gestures[ i ].name
					,	'points'	: match / gsteps.length
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


/** GestoJS - Events and Event model */

(function( GestoJS ) {

	"use strict"

	/**
	 * Gesture model
	 * @param data		{string} gesture data
	 * @param priority	{int}
	 */
	var Gesture = function( name, data, priority ) {
		this.name = name
		this.priority = priority || 0

		this.gestureData = []

		if (typeof data === 'string') this.gestureData.push( data )
		if (data instanceof Array) this.gestureData = data
	}

	// Became public
	GestoJS.core.Gesture = Gesture

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
		,	a90 = Math.PI / 2
		,	a360 = Math.PI * 2

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

				if (lastAng >  a90 && curAng < -a90) loops++; // detect clockwise loop
				if (lastAng < -a90 && curAng > a90) loops--; // detect anticlockwise loop
				curRot = curAng + loops*a360
				if ( lastRot !== null ) {
					track.rotation += curRot - lastRot
					track.absoluteRotation += Math.abs( curRot - lastRot )
				}

				lastRot = curRot
				lastAng = curAng

				// Loops (offset corrected)
				track.loops = Math.floor( track.rotation / a360 ) + ( track.rotation < 0 ? 1 : 0 )

				// Angle
				track.endAngle = track.getAngle( Math.max( 0, track.points.length - 4 ), track.points.length - 1  )
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
		this.absoluteRotation = 0
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
			return new GestoJS.core.Point( this.points[ this.points.length - 1 ].x - this.points[ 0 ].x,
										   this.points[ this.points.length - 1 ].y - this.points[ 0 ].y )
		}

		/**
		 * Get middle point of track
		 * @return				{Object} Offset object
		 */
		this.getMiddle = function() {
			return new GestoJS.core.Point( sumX / this.points.length, sumY / this.points.length )
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
	Events.ON_PROGRESS = "onProgress"

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
		this.analyzer = null			// Analyzer instance
	}

	/**
	 * Analyze
	 */
	Events.Event.prototype.analyzeGesture = function( gestures ) {
		var gestureList
		if (!this.analyzer) return null

		if (gestures instanceof GestoJS.core.GestureList) {
			gestureList = gestures
		} else {
			gestureList = new GestoJS.core.GestureList()
			gestureList.add( gestures )
		}

		return this.analyzer.analyze( this.tracks, gestureList )
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


/** GestoJS - Events and Event model */

(function( GestoJS ) {

	"use strict"

	/**
	 * GestureList model
	 */
	var GestureList = function() {
		this.list = {}
	}

	/**
	 * Add single or multiple gestures to the list
	 * @param gestures	{mixed} single gesture data string, gesture array or gesture names
	 * @param priority	{number} priority
	 */
	GestureList.prototype.add = function( gestures, priority ) {
		var i,ii

		// Add single gesture instance
		if (gestures instanceof GestoJS.core.Gesture) {
			gestures.priority = priority || gestures.priority || 0
			this.list[ gestures.name ] = gestures
		}

		// Allow multiple gestures in single string, separated by comma
		if (typeof gestures === 'string') {
			gestures = gestures.split(',')
		}

		if (gestures instanceof Array) {
			for (i=0,ii=gestures.length;i<ii;i++) {
				if ( gestures[i] instanceof GestoJS.core.Gesture ) {
					// Add gesture instance
					// Update priority
					gestures[i].priority = priority || gestures[i].priority || 0
					// Add directly to list object
					this.list[ gestures[i].name ] = gestures[i]
				} else if ( typeof gestures[i] === 'string' && GestoJS.gesture[ gestures[i] ] ) {
					// Create predefined gesture and add to list object
					this.list[ gestures[i] ] = new GestoJS.core.Gesture( gestures[i], GestoJS.gesture[ gestures ], priority )
				} else {
					// Create custom gesture and add to list object
					this.list[ 'gesture'+(i+1)	 ] = new GestoJS.core.Gesture( 'gesture'+(i+1), gestures[i].toString(), priority )
				}
			}
		}
	}

	/**
	 * Remove gesture from list
	 * @param name	{string} gesture name
	 */
	GestureList.prototype.remove = function( name ) {
		delete this.list[ name ]
	}

	/**
	 * Return sorted gesture arrays
	 * @return {array}
	 */
	GestureList.prototype.getSorted = function() {
		var sorted = [], i, ii

		// Copy to array
		for (i in this.list) sorted.push( this.list[i] )

		// Sort by priority
		sorted.sort( function( a, b ) {
			if (a.priority > b.priority) return 1
			if (b.priority > a.priority) return -1
			return 0
		})

		return sorted
	}

	// Became public
	GestoJS.core.GestureList = GestureList

})( window.GestoJS )

/** GestoJS - Base class */

(function() {

	"use strict"

	var GestoJS = function( target, autoload ) {

		var	instance = this
		,	initialized	= false
		,	gestures = new GestoJS.core.GestureList()
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

			// Fake bubbling
			tracker.addListener( GestoJS.event.ON_TRACK_START, dispatch )
			tracker.addListener( GestoJS.event.ON_TRACK_COMPLETE, dispatch )
			tracker.addListener( GestoJS.event.ON_TRACK_PROGRESS, dispatch )
			tracker.addListener( GestoJS.event.ON_TRACK_COMPLETE, dispatch )

			// Gesture progress
			tracker.addListener( GestoJS.event.ON_TRACK_PROGRESS, progress )

			// Gesture completed
			tracker.addListener( GestoJS.event.ON_TRACK_COMPLETE, analyze )

			// Initialize gesture analyzer
			analyzer = new GestoJS.core.Analyzer()

			// Autoload all gestures
			if( autoload ) for (i in GestoJS.gesture) instance.addGesture( i )

		}

		/**
		 * Analyze a tracker event on completed gesture
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
		 * Complete progress event
		 * @param event			{GestoJS.event.Event} Event with tracks data
		 */
		var progress = function( event ) {
			var ev = new GestoJS.event.Event( GestoJS.event.ON_PROGRESS )
				ev.tracks = event.tracks
				ev.analyzer = analyzer

			dispatch( ev )
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
			gestures.add( new GestoJS.core.Gesture( name, gestureArray || GestoJS.gesture[ name ] ), priority )
		}

		/**
		 * Remove gesture from check list
		 * @param name			{string}
		 */
		this.removeGesture = function( name ) {
			gestures.remove( name )
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
	GestoJS.debug = 1

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
/** GestoJS - Multitouch analyzers */

(function (GestoJS) {

	GestoJS.analyzer[ 'pinch' ] = function( gesture, zoom, parallelThreshold ) {
		var other, angleA, angleB, distA, distB, radA, radB

		if (gesture.step.tracks.length !== 2) return 0	// limit to gestures with 2 tracks

		parallelThreshold = parseFloat( parallelThreshold ) / 180 * Math.PI || Math.PI / 4 /* 45º */
		zoom = parseInt( zoom, 10 )
		other = gesture.step.tracks[ this === gesture.step.tracks[0] ? 1 : 0 ]

		angleA = this.points[ 0 ].angleTo( other.points[ 0 ] )
		angleB = this.points[ this.points.length - 1 ].angleTo( other.points[ other.points.length - 1 ] )
		distA = this.points[ 0 ].distanceTo( other.points[ 0 ] )
		distB = this.points[ this.points.length - 1 ].distanceTo( other.points[ other.points.length - 1 ] )
		radA = this.offset.angle()
		radB = other.offset.angle()

		return Math.abs( Math.sin( radA ) + Math.sin( radB )) < Math.PI / 4	// opposite
			&& Math.abs( Math.cos( radA )	+ Math.cos( radB )) < Math.PI / 4
			&& distA * zoom > distB * zoom							// in/out
			&& Math.abs( angleA - angleB ) <= parallelThreshold		// parallels
			 ? 1 : 0
	}

})( window.GestoJS )
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
/** GestoJS - Linear movements analyzers */

(function (GestoJS) {

	GestoJS.analyzer[ 'line' ] = function( gesture, angle, threshold ) {
		angle = parseFloat( angle ) / 180 * Math.PI
		threshold = parseFloat( threshold ) / 180 * Math.PI || Math.PI / 6 /* 30º */

		return this.absoluteRotation < Math.PI / 2 /* 90º */	// not curve
			&& this.length > 5									// min length
			&& (this.endAngle >= angle-threshold && this.endAngle <= angle+threshold
				|| this.endAngle+(Math.PI*2) >= angle-threshold && this.endAngle+(Math.PI*2) <= angle+threshold)
			 ? 1 - Math.abs( angle - this.endAngle ) / (threshold * 2) : 0
	}

})( window.GestoJS )
/** GestoJS - Some predefined gestures */

(function (GestoJS) {

	/*
	 * Some simple documentation:
	 *
	 * Gestures are divided in time steps:
	 * - 2 fast taps has 2 steps
	 * - but 2 taps at same time, has 1 step
	 *
	 * An step represents each element in Array:
	 * [ "Step1", "Step2, ... ]
	 *
	 * Each step has an string, which will be evaluated. This string contains
	 * one or multiple analyzers (functions) that return a numeric value between
	 * 0 and 1, representing matching quality. This analyzers can have some
	 * parameters:
	 *
	 * "tap()" detects simple touch
	 * "circle()" detects circular gesture
	 * "line(90)" detects linear gesture pointing to up
	 *
	 * You can sum, multiply, apply boolean or any operation with analyzer
	 * results:
	 *
	 * - "arc(720) * circle()" Detects double circle gesture
	 * - "line(90) || line(-90)" Detects up or down linear gesture
	 *
	 * For multitouch gestures, you can use operator AND (&&), to jump to next
	 * touch:
	 *
	 * - "tap() && tap()" Detects two tap at same time
	 *
	 * Happy coding!
	 */

	GestoJS.gesture[ 'tap' ]				= [ 'tap()' ]
	GestoJS.gesture[ 'twoTap' ]				= [ 'tap()', 'tap()' ]
	GestoJS.gesture[ 'longTap' ]			= [ 'longTap()' ]
	GestoJS.gesture[ 'twoTapLong']			= [ 'tap()', 'longTap()' ]
	GestoJS.gesture[ 'doubleTap' ]			= [ 'tap() && tap()' ]
	GestoJS.gesture[ 'doubleLongTap' ]		= [ 'longTap() && longTap()' ]
	GestoJS.gesture[ 'twoDoubleTap' ]		= [ 'tap() && tap()', 'tap() && tap()' ]

	GestoJS.gesture[ 'swipeLeft' ]			= [ 'line(0)' ]
	GestoJS.gesture[ 'swipeRight' ]			= [ 'line(180)' ]
	GestoJS.gesture[ 'swipeUp' ]			= [ 'line(90)' ]
	GestoJS.gesture[ 'swipeDown' ]			= [ 'line(-90)' ]

	GestoJS.gesture[ 'doubleSwipeLeft' ]	= [ 'line(0) && line(0)' ]
	GestoJS.gesture[ 'doubleSwipeRight' ]	= [ 'line(180) && line(180)' ]
	GestoJS.gesture[ 'doubleSwipeUp' ]		= [ 'line(90) && line(90)' ]
	GestoJS.gesture[ 'doubleSwipeDown' ]	= [ 'line(-90) && line(-90)' ]

	GestoJS.gesture[ 'zoomIn' ]				= [ 'pinch(-1) && pinch(-1)' ]
	GestoJS.gesture[ 'zoomOut' ]			= [ 'pinch(1) && pinch(1)' ]

	GestoJS.gesture[ 'circle' ]				= [ 'arc(400,90) * circle() || arc(-400,90) * circle()' ]
	GestoJS.gesture[ 'circleRight' ]		= [ 'arc(400,90) * circle()' ]
	GestoJS.gesture[ 'circleLeft' ]			= [ 'arc(-400,90) * circle()' ]


})( window.GestoJS )
// Disabled by default for production
GestoJS.debug=0