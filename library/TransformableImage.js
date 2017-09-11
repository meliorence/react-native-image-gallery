'use strict';

import React, { PureComponent, PropTypes } from 'react';
import { Image } from 'react-native';

import ViewTransformer from 'react-native-view-transformer';

const DEV = false;

export default class TransformableImage extends PureComponent {

  static enableDebug() {
    DEV = true;
  }

  static propTypes = {
    source: PropTypes.shape({
        uri: PropTypes.string.isRequired,
        dimensions: PropTypes.shape({
            width: PropTypes.number,
            height: PropTypes.number,
        }),
    }),
    enableTransform: PropTypes.bool,
    enableScale: PropTypes.bool,
    enableTranslate: PropTypes.bool,
    onTransformGestureReleased: PropTypes.func,
    onViewTransformed: PropTypes.func,
    imageComponent: PropTypes.func,
    resizeMode: PropTypes.string,
  };

  static defaultProps = {
    enableTransform: true,
    enableScale: true,
    enableTranslate: true,
    imageComponent: undefined,
    resizeMode: 'contain',
  };

  constructor(props) {
    super(props);

    this.state = {
      viewWidth: 0,
      viewHeight: 0,

      imageLoaded: false,
      imageDimensions: props.source.dimensions,
      keyAcumulator: 1
    };
  }

  componentWillMount() {
    if (!this.state.imageDimensions) {
      this.getImageSize(this.props.source);
    }
  }

  componentWillReceiveProps(nextProps) {
    DEV && console.log('TransformableImage: componentWillReceiveProps');
    if (!sameSource(this.props.source, nextProps.source)) {
      DEV && console.log('TransformableImage: componentWillReceiveProps - different source');
      //image source changed, clear last image's imageDimensions info if any
      this.setState({imageDimensions: props.source.dimensions, keyAcumulator: this.state.keyAcumulator + 1})
      if (!props.source.dimensions) { // if we don't have image dimensions provided in source
        this.getImageSize(nextProps.source);
      }
    }
  }

  render() {
    let maxScale = 1;
    let contentAspectRatio = undefined;
    let width, height; //imageDimensions

    if (this.state.imageDimensions) {
      width = this.state.imageDimensions.width;
      height = this.state.imageDimensions.height;
    }

    if (width && height) {
        DEV && console.log(`TransformableImage: (${width}, ${height})`)
      contentAspectRatio = width / height;
      if (this.state.viewWidth && this.state.viewHeight) {
        maxScale = Math.max(width / this.state.viewWidth, height / this.state.viewHeight);
        maxScale = Math.max(1, maxScale);
      }
    }

    const imageProps = {
      ...this.props,
      style: [this.props.style, {backgroundColor: 'transparent'}],
      resizeMode: this.props.resizeMode,
      onLoadStart: this.onLoadStart.bind(this),
      onLoad: this.onLoad.bind(this),
      capInsets: {left: 0.1, top: 0.1, right: 0.1, bottom: 0.1},
    }

    const image = this.props.imageComponent ?
        this.props.imageComponent(imageProps) :
        <Image { ...imageProps } />

    return (
      <ViewTransformer
        ref='viewTransformer'
        key={'viewTransformer#' + this.state.keyAccumulator} //when image source changes, we should use a different node to avoid reusing previous transform state
        enableTransform={this.props.enableTransform && this.state.imageLoaded} //disable transform until image is loaded
        enableScale={this.props.enableScale}
        enableTranslate={this.props.enableTranslate}
        enableResistance={true}
        onTransformGestureReleased={this.props.onTransformGestureReleased}
        onViewTransformed={this.props.onViewTransformed}
        maxScale={maxScale}
        contentAspectRatio={contentAspectRatio}
        onLayout={this.onLayout.bind(this)}
        style={this.props.style}>
        { image }
      </ViewTransformer>
    );
  }

  onLoadStart(e) {
    this.props.onLoadStart && this.props.onLoadStart(e);
    if (this.state.imageLoaded) {
      this.setState({
        imageLoaded: false
      });
    }
  }

  onLoad(e) {
    this.props.onLoad && this.props.onLoad(e);
    if (!this.state.imageLoaded) {
      this.setState({
        imageLoaded: true
      });
    }
  }

  onLayout(e) {
    let {width, height} = e.nativeEvent.layout;
    if (this.state.viewWidth !== width || this.state.viewHeight !== height) {
      this.setState({
        viewWidth: width,
        viewHeight: height
      });
    }
  }

  getImageSize(source) {
    if(!source) return;

    DEV && console.log('getImageSize...' + JSON.stringify(source));

    if (typeof Image.getSize === 'function') {
      if (source && source.uri) {
        Image.getSize(
          source.uri,
          (width, height) => {
            DEV && console.log('getImageSize...width=' + width + ', height=' + height);
            if (width && height) {
              if(this.state.imageDimensions && this.state.imageDimensions.width === width && this.state.imageDimensions.height === height) {
                //no need to update state
              } else {
                this.setState({imageDimensions: {width, height}});
              }
            }
          },
          (error) => {
            console.error('getImageSize...error=' + JSON.stringify(error) + ', source=' + JSON.stringify(source));
          })
      } else {
        console.warn('getImageSize...please provide imageDimensions prop for local images');
      }
    } else {
      console.warn('getImageSize...Image.getSize function not available before react-native v0.28');
    }
  }

  getViewTransformerInstance() {
    return this.refs['viewTransformer'];
  }
}

function sameSource(source, nextSource) {
  if (source === nextSource) {
    return true;
  }
  if (source && nextSource) {
    if (source.uri && nextSource.uri) {
      return source.uri === nextSource.uri;
    }
  }
  return false;
}
