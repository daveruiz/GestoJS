GestoJS
=======

Gesture lib for javascript mobile developments

**Basic usage:**

```js
var gesto = new GestoJS();

gesto.addGesture( GestoJS.gestures.swipeLeft )
gesto.addGesture( GestoJS.gestures.swipeRight )

gesto.addEventListener( 'onGesture', function( event ) {
  var gesture = event.gestures[0]
  
  switch( gesture ) {
    
    case GestoJS.gestures.swipeLeft:
      // Do something on swipe left
      break
      
    case GestoJS.gestures.swipeRight:
      // Do something on swipe right
      break
    
  }
});
```