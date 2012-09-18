/**
 * GestoJS
 * Gesture model (unused at this moment)
 *
 * @autor David Ruiz | david@daveruiz.net
 */

(function( GestoJS ) {

	"use strict"

	/* Private shared methods */

	/**
	 * Parse a gesture in string format
	 *
	 * @param string {string|array} Event to listen
	 * @return {array} gesture data array
	 */
	var parse = function( steps ) {

		var i = 0
		,	gestureData = []
		,	event
		,	params

        // Single step
        if (typeof steps === 'string') steps = [ steps ]

        /*
         *  TODO:
         *
         *  Do replacements in gesture string with event(parameters).
         *  Then, evalue string
         */
		for (;i<steps.length;i++) {
			event = steps[i].match( /([^\s\(]+)/ )[1]
			params = steps[i].match( /^[^\(]\(([^\)]*)/)[1]

			gestureData.push( new GesturePart( i, event, params ) )
		}

		if (!gestureData.length) {
			throw new Error( 'Gesture parse failed. No steps registered!' )
		}

	}

	/**
	 * Gesture part model
	 */
	var GestureStep = function( step, event, data ) {

		this.step = step
		this.event = event
		this.data = data

	}

	/**
	 * Gesture model
	 */
	var Gesture = function( string ) {

		/* Private vars */

		var data = []

		/* Public vars */

		this.length = 0

		/* Init */

		if ( string ) {
			try {
				data = parseString( string )
				this.length = data.length
			} catch( error ) {
				data = []
				this.length = 0
				GestoJS.err( error )
			}
		}

        this.analyze

	}

	// Became public
	GestoJS.core.Gesture = Gesture

})( window.GestoJS )

