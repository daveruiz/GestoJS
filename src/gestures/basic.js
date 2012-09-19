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

	GestoJS.gesture[ 'circle' ]				= [ 'curve(360,90) * loop()' ]
	GestoJS.gesture[ 'circleRight' ]		= [ 'curve(360,90) * loop()' ]
	GestoJS.gesture[ 'circleLeft' ]			= [ 'curve(-360,90) * loop()' ]

})( window.GestoJS )