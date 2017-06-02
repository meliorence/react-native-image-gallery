# react-native-image-gallery

>This used to be a fork of [ldn0x7dc/react-native-gallery](https://github.com/ldn0x7dc/react-native-image-gallery) but since the author has stopped maintaining it, here's our own repo. Props to him for his work !

A pure JavaScript image gallery component for react-native apps with common gestures like pan, pinch and doubleTap, supporting both iOS and Android.

This component aims to be (one of) the best image viewer for react-native apps. Comparing with other gallery alike components, this one should be more elegant in following aspects: (mimics iOS system photo album app).

* Gesture handle: besides common pan, pinch and doubleTap, this component does well in targeting foucs point( or pivot) when zoom-in and zoom-out.
* Responder switch: the gesture responder switch is more flexible than any other component, that is, the scrollable container and the wrapped image children perform well in acquiring and releasing gesture responder from/to each other.

This component works on react-native **0.28+**.

You can try this example live in **Archriss' showcase app** on [Android](https://play.google.com/store/apps/details?id=fr.archriss.demo.app) and [iOS](https://itunes.apple.com/lu/app/archriss-presentation-mobile/id1180954376?mt=8).

![react-native-image-gallery](https://media.giphy.com/media/3o7bugPvJyqYWz9bK8/giphy.gif)

## Install

`npm install --save react-native-image-gallery@latest`

## Documentaion

Quite easy to use:

```javascript
import Gallery from 'react-native-image-gallery';

  render() {
    return (
      <Gallery
        style={{flex: 1, backgroundColor: 'black'}}
        images={[
          { source: require('yourApp/image.png'), dimensions: { width: 150, height: 150 } },
          { source: { uri: 'http://p10.qhimg.com/t019e9cf51692f735be.jpg' } },
          { source: { uri: 'http://ww2.sinaimg.cn/mw690/714a59a7tw1dxqkkg0cwlj.jpg' } },
          { source: { uri: 'http://www.bz55.com/uploads/allimg/150122/139-150122145421.jpg' } }
        ]}
      />
    );
  }
```

You can now use either a remote image, by specifying `source.uri`, or a local image where `source` is the result of your `require()`. **Be aware that you need to pass the dimensions of your local images ! It's still not required for remotes images.**

This component utilizes **[@ldn0x7dc/react-native-view-pager](https://github.com/ldn0x7dc/react-native-view-pager)** as the scrollable container and **[react-native-transformable-image](https://github.com/ldn0x7dc/react-native-transformable-image)** as the wrapped image. 

#### Props

* **images**: array, contains image urls
* **initialPage**, **pageMargin**, **onPageSelected**, **onPageScrollStateChanged**, **onPageScroll**: inherited from **[@ldn0x7dc/react-native-view-pager](https://github.com/ldn0x7dc/react-native-view-pager)**. Check the link for more details.
* **onSingleTapConfirmed**: Called after user single taped( not a double tap)
* **onGalleryStateChanged**: function. (idle) => {}.
* **onLongPress**: (gestureState) => {}
* **loader**: React component that will be displayed before each image has been loaded. For instance, you could use `ActivityIndicator`.

### Add your custom views above image

It's a common practice to float a comment box or like button above the image. This component provides a convenient interface to implement this feature:

- onSingleTapConfirmed(): a good time for you to display the responding floating view. 
- onGalleryStateChanged(idle): If *idle* is false, it's a good time for your to hide any floating views.
