# react-native-gallery

An **image gallery** component for react-native apps with common gestures like pan, pinch and doubleTap. Written in pure JavaScript. Supports both iOS and Android.

We'll continue to make this component as elegant as the iOS system gallery and keep it simple(Focusing on the image-viewing function).

This component works on react-native 0.28+.

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
        style={{backgroundColor: 'black'}}
        images={[
          'http://p10.qhimg.com/t019e9cf51692f735be.jpg',
          'http://ww2.sinaimg.cn/mw690/714a59a7tw1dxqkkg0cwlj.jpg',
          'http://www.bz55.com/uploads/allimg/150122/139-150122145421.jpg',
          'http://p10.qhimg.com/t019e9cf51692f735be.jpg',
          'http://ww2.sinaimg.cn/mw690/714a59a7tw1dxqkkg0cwlj.jpg',
          'http://www.bz55.com/uploads/allimg/150122/139-150122145421.jpg',
          'http://p10.qhimg.com/t019e9cf51692f735be.jpg',
          'http://ww2.sinaimg.cn/mw690/714a59a7tw1dxqkkg0cwlj.jpg',
          'http://www.bz55.com/uploads/allimg/150122/139-150122145421.jpg',
          'http://p10.qhimg.com/t019e9cf51692f735be.jpg',
          'http://ww2.sinaimg.cn/mw690/714a59a7tw1dxqkkg0cwlj.jpg',
          'http://www.bz55.com/uploads/allimg/150122/139-150122145421.jpg',
          'http://p10.qhimg.com/t019e9cf51692f735be.jpg',
          'http://ww2.sinaimg.cn/mw690/714a59a7tw1dxqkkg0cwlj.jpg',
          'http://www.bz55.com/uploads/allimg/150122/139-150122145421.jpg'
        ]}
      />
    );
  }
```

This component wraps a horizontal ListView, which is composed of **transformable images**(check [react-native-transformable-image](https://github.com/ldn0x7dc/react-native-transformable-image) for more detail).



## TODO

1. Support **initialPage** prop
2. Support **pageMargin** prop 
3. Support custom views on each page(so that we can implement functions like comments, image descriptions, like button, etc)
4. Dump off-screen images for better performance.(Maybe simply replacing the ListView wraper with [react-native-sglistview](https://github.com/sghiassy/react-native-sglistview))