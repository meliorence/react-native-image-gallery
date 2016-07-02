# react-native-gallery

An pure JavaScript image gallery component for react-native apps with common gestures like pan, pinch and doubleTap, supporting both iOS and Android.

This component aims to be (one of ) the best image viewer for react-native apps. Comparing with other components both on react-native and native iOS/Android, the component should be more elegant in following aspects: (mimics iOS system photo album app)

* Gesture handle: besides common pan, pinch and doubleTap, this component does well in targeting foucs point( or pivot) when zoom-in and zoom-out.
* Responder switch: the gesture responder switch is more flexible than any other component, that is, the scrollable container and the wrapped image children perform well in acquiring and releasing gesture responder from/to each other.

This component works on react-native 0.28+ and supports remote images only for now.

![](Demo/demo.gif)



## Install

`npm install --save react-native-gallery@latest`



## Documentaion

Quite easy to use:

```
import Gallery from 'react-native-gallery';
...

  render() {
    return (
      <Gallery
        style={{flex: 1, backgroundColor: 'black'}}
        images={[
          'http://p10.qhimg.com/t019e9cf51692f735be.jpg',
          'http://ww2.sinaimg.cn/mw690/714a59a7tw1dxqkkg0cwlj.jpg',
          'http://www.bz55.com/uploads/allimg/150122/139-150122145421.jpg'
        ]}
      />
    );
  }
```

This component utilizes **[@ldn0x7dc/react-native-view-pager](https://github.com/ldn0x7dc/react-native-view-pager)** as the scrollable container and **[react-native-transformable-image](https://github.com/ldn0x7dc/react-native-transformable-image)** as the wrapped image. 

#### Props

* **images**: array, contains image urls
* **initialPage**, **pageMargin**, **onPageSelected**, **onPageScrollStateChanged**, **onPageScroll**: inherited from **[@ldn0x7dc/react-native-view-pager](https://github.com/ldn0x7dc/react-native-view-pager)**. Check the link for more details.




## Attention

This component is being actively developed but should be ready for production realease.

If you encounter any problem that seems unnormal, just create an issue or check out the latest release.


## TODO

* Dump off-screen images for better performance if needed
* Provide a convenient interface to implement floating custom views like social comment box or other menus.
  * onSingleTapConfirmed(pageId): Called after user single tapped (not double) **and** the gallery is idle. This should be a good time for you to display the responding floating view. 
  * onGalleryIdleStateChanged(idleOrNot): Called when gallery becomes busy ( user starts to move or zoom images) or when gallery becomes idle (no fingers active nor any animation going on). If *idleOrNot* is false, it's a good time for your to hide any floating views.