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