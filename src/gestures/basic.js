/** GestoJS - Some predefined gestures */

(function (GestoJS) {

	/**
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