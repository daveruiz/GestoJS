GestoJS
=======

Gesture lib for javascript mobile developments

**Basic usage:**

```js
var gesto = new GestoJS();

gesto.addGesture( GestoJS.gesture.swipeLeft )
gesto.addGesture( GestoJS.gesture.swipeRight )

gesto.addEventListener( 'onGesture', function( event ) {
  var gesture = event.gestures[0]
  
  switch( gesture ) {
    
    case GestoJS.gesture.swipeLeft:
      // Do something on swipe left
      break
      
    case GestoJS.gesture.swipeRight:
      // Do something on swipe right
      break
    
  }
});
```