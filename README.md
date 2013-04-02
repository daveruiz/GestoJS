GestoJS
=======

Gesture lib for javascript mobile developments

**Basic usage:**

**Features**

- Multitouch support
- You can program custom gestures
- Without dependences

```js
var gesto = new GestoJS();

gesto.addGesture( 'swipeLeft' )
gesto.addGesture( 'swipeRight' )

gesto.addEventListener( 'onGesture', function( event ) {
  var gesture = event.gestures[0]

  switch( gesture.name ) {

    case 'swipeLeft':
      // Do something on swipe left
      break

    case 'swipeRight':
      // Do something on swipe right
      break

  }
});
```

**Version history:**
(*) New feature

*v0.3*
- (*) Added handlers! (see example)
- Refactor of events handling
- Updated examples
- Fixed gesture parser
- Other minor fixes

*v0.2*
- (*) Live gesture capturing feature
- Gesture managing refactor
- Updated examples

*v0.1 alpha*
 - First release

