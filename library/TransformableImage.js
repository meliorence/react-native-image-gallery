'use strict';

import React, { Component, PropTypes } from 'react';
import { Image } from 'react-native';

import ViewTransformer from 'react-native-view-transformer';

let DEV = true;

export default class TransformableImage extends Component {

  static enableDebug() {
    DEV = true;
  }

  static propTypes = {
    pixels: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
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
      width: 0,
      height: 0,

      imageLoaded: false,
      pixels: undefined,
      keyAcumulator: 1
    };
  }

  componentWillMount() {
    if (!this.props.pixels) {
      this.getImageSize(this.props.source);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!sameSource(this.props.source, nextProps.source)) {
      //image source changed, clear last image's pixels info if any
      this.setState({pixels: undefined, keyAcumulator: this.state.keyAcumulator + 1})
      this.getImageSize(nextProps.source);
    }
  }

  render() {
    let maxScale = 1;
    let contentAspectRatio = undefined;
    let width, height; //pixels

    if (this.props.pixels) {
      //if provided via props
      width = this.props.pixels.width;
      height = this.props.pixels.height;
    } else if (this.state.pixels) {
      //if got using Image.getSize()
      width = this.state.pixels.width;
      height = this.state.pixels.height;
    }

    if (width && height) {
        DEV && console.log(`TransformableImage: (${width}, ${height})`)
      contentAspectRatio = width / height;
      if (this.state.width && this.state.height) {
        maxScale = Math.max(width / this.state.width, height / this.state.height);
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
    if (this.state.width !== width || this.state.height !== height) {
      this.setState({
        width: width,
        height: height
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
              if(this.state.pixels && this.state.pixels.width === width && this.state.pixels.height === height) {
                //no need to update state
              } else {
                this.setState({pixels: {width, height}});
              }
            }
          },
          (error) => {
            console.error('getImageSize...error=' + JSON.stringify(error) + ', source=' + JSON.stringify(source));
          })
      } else {
        console.warn('getImageSize...please provide pixels prop for local images');
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
