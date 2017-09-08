import React, { Component, PropTypes } from 'react';
import { View, Image } from 'react-native';
import { createResponder } from 'react-native-gesture-responder';
import TransformableImage from './TransformableImage';
import ViewPager from './ViewPager';

export default class Gallery extends Component {

    static propTypes = {
        ...View.propTypes,
        images: PropTypes.array,
        initialPage: PropTypes.number,
        pageMargin: PropTypes.number,
        onPageSelected: PropTypes.func,
        onPageScrollStateChanged: PropTypes.func,
        onPageScroll: PropTypes.func,
        onSingleTapConfirmed: PropTypes.func,
        onGalleryStateChanged: PropTypes.func,
        onLongPress: PropTypes.func,
        initialListSize: PropTypes.number,
        removeClippedSubviews: PropTypes.bool,
        imageComponent: PropTypes.func,
    };

    static defaultProps = {
      initialListSize: 10,
      removeClippedSubviews: true,
      imageComponent: undefined,
    };

    imageRefs = new Map();
    activeResponder = undefined;
    firstMove = true;
    currentPage = 0;
    pageCount = 0;
    gestureResponder = undefined;

    constructor (props) {
        super(props);
        this.state = {
            imagesDimensions: []
        };
        this.renderPage = this.renderPage.bind(this);
        this.onPageSelected = this.onPageSelected.bind(this);
        this.onPageScrollStateChanged = this.onPageScrollStateChanged.bind(this);
        this.onPageScroll = this.onPageScroll.bind(this);
    }

    componentWillMount () {
        function onResponderReleaseOrTerminate (evt, gestureState) {
            if (this.activeResponder) {
                if (this.activeResponder === this.viewPagerResponder &&
                    !this.shouldScrollViewPager(evt, gestureState) &&
                    Math.abs(gestureState.vx) > 0.5) {
                    this.activeResponder.onEnd(evt, gestureState, true);
                    this.getViewPagerInstance().flingToPage(this.currentPage, gestureState.vx);
                } else {
                    this.activeResponder.onEnd(evt, gestureState);
                }
                this.activeResponder = null;
            }
            this.firstMove = true;
            this.props.onGalleryStateChanged && this.props.onGalleryStateChanged(true);
        }

        this.gestureResponder = createResponder({
            onStartShouldSetResponderCapture: (evt, gestureState) => true,
            onStartShouldSetResponder: (evt, gestureState) => {
                return true;
            },
            onResponderGrant: (evt, gestureState) => {
                this.activeImageResponder(evt, gestureState);
            },
            onResponderMove: (evt, gestureState) => {
                if (this.firstMove) {
                    this.firstMove = false;
                    if (this.shouldScrollViewPager(evt, gestureState)) {
                        this.activeViewPagerResponder(evt, gestureState);
                    }
                    this.props.onGalleryStateChanged && this.props.onGalleryStateChanged(false);
                }
                if (this.activeResponder === this.viewPagerResponder) {
                    const dx = gestureState.moveX - gestureState.previousMoveX;
                    const offset = this.getViewPagerInstance().getScrollOffsetFromCurrentPage();
                    if (dx > 0 && offset > 0 && !this.shouldScrollViewPager(evt, gestureState)) {
                        if (dx > offset) { // active image responder
                            this.getViewPagerInstance().scrollByOffset(offset);
                            gestureState.moveX -= offset;
                            this.activeImageResponder(evt, gestureState);
                        }
                    } else if (dx < 0 && offset < 0 && !this.shouldScrollViewPager(evt, gestureState)) {
                        if (dx < offset) { // active image responder
                            this.getViewPagerInstance().scrollByOffset(offset);
                            gestureState.moveX -= offset;
                            this.activeImageResponder(evt, gestureState);
                        }
                    }
                }
                this.activeResponder.onMove(evt, gestureState);
            },
            onResponderRelease: onResponderReleaseOrTerminate.bind(this),
            onResponderTerminate: onResponderReleaseOrTerminate.bind(this),
            onResponderTerminationRequest: (evt, gestureState) => false, // Do not allow parent view to intercept gesture
            onResponderSingleTapConfirmed: (evt, gestureState) => {
                this.props.onSingleTapConfirmed && this.props.onSingleTapConfirmed(this.currentPage);
            }
        });

        this.viewPagerResponder = {
            onStart: (evt, gestureState) => {
                this.getViewPagerInstance().onResponderGrant(evt, gestureState);
            },
            onMove: (evt, gestureState) => {
                this.getViewPagerInstance().onResponderMove(evt, gestureState);
            },
            onEnd: (evt, gestureState, disableSettle) => {
                this.getViewPagerInstance().onResponderRelease(evt, gestureState, disableSettle);
            }
        };

        this.imageResponder = {
            onStart: (evt, gestureState) => {
                this.getCurrentImageTransformer().onResponderGrant(evt, gestureState);
                if (this.props.onLongPress) {
                    this._longPressTimeout = setTimeout(() => {
                        this.props.onLongPress(gestureState);
                    }, 600);
                }
            },
            onMove: (evt, gestureState) => {
                this.getCurrentImageTransformer().onResponderMove(evt, gestureState);
                clearTimeout(this._longPressTimeout);
            },
            onEnd: (evt, gestureState) => {
                this.getCurrentImageTransformer().onResponderRelease(evt, gestureState);
                clearTimeout(this._longPressTimeout);
            }
        };
    }

    componentDidMount () {
        this._isMounted = true;
    }

    componentWillUnmount () {
        this._isMounted = false;
    }

    shouldScrollViewPager (evt, gestureState) {
        if (gestureState.numberActiveTouches > 1) {
            return false;
        }
        const viewTransformer = this.getCurrentImageTransformer();
        const space = viewTransformer.getAvailableTranslateSpace();
        const dx = gestureState.moveX - gestureState.previousMoveX;

        if (dx > 0 && space.left <= 0 && this.currentPage > 0) {
            return true;
        }
        if (dx < 0 && space.right <= 0 && this.currentPage < this.pageCount - 1) {
            return true;
        }
        return false;
    }

    activeImageResponder (evt, gestureState) {
        if (this.activeResponder !== this.imageResponder) {
            if (this.activeResponder === this.viewPagerResponder) {
                this.viewPagerResponder.onEnd(evt, gestureState, true); // pass true to disable ViewPager settle
            }
            this.activeResponder = this.imageResponder;
            this.imageResponder.onStart(evt, gestureState);
        }
    }

    activeViewPagerResponder (evt, gestureState) {
        if (this.activeResponder !== this.viewPagerResponder) {
            if (this.activeResponder === this.imageResponder) {
                this.imageResponder.onEnd(evt, gestureState);
            }
            this.activeResponder = this.viewPagerResponder;
            this.viewPagerResponder.onStart(evt, gestureState);
        }
    }

    getImageTransformer (page) {
        if (page >= 0 && page < this.pageCount) {
            let ref = this.imageRefs.get(page + '');
            if (ref) {
                return ref.getViewTransformerInstance();
            }
        }
    }

    getCurrentImageTransformer () {
        return this.getImageTransformer(this.currentPage);
    }

    getViewPagerInstance () {
        return this.refs['galleryViewPager'];
    }

    onPageSelected (page) {
        this.currentPage = page;
        this.props.onPageSelected && this.props.onPageSelected(page);
    }

    onPageScrollStateChanged (state) {
        if (state === 'idle') {
            this.resetHistoryImageTransform();
        }
        this.props.onPageScrollStateChanged && this.props.onPageScrollStateChanged(state);
    }

    onPageScroll (e) {
        this.props.onPageScroll && this.props.onPageScroll(e);
    }

    renderPage (pageData, pageId, layout) {
        const { onViewTransformed, onTransformGestureReleased, ...other } = this.props;
        return (
            <TransformableImage
              {...other}
              onViewTransformed={((transform) => {
                  onViewTransformed && onViewTransformed(transform, pageId);
              })}
              onTransformGestureReleased={((transform) => {
                  onTransformGestureReleased && onTransformGestureReleased(transform, pageId);
              })}
              ref={((ref) => { this.imageRefs.set(pageId, ref); })}
              key={'innerImage#' + pageId}
              style={{width: layout.width, height: layout.height}}
              source={pageData.source}
              pixels={ pageData.dimensions || pageData.source.dimensions || {}}
            />
        );
    }

    resetHistoryImageTransform () {
        let transformer = this.getImageTransformer(this.currentPage + 1);
        if (transformer) {
            transformer.forceUpdateTransform({scale: 1, translateX: 0, translateY: 0});
        }

        transformer = this.getImageTransformer(this.currentPage - 1);
        if (transformer) {
            transformer.forceUpdateTransform({scale: 1, translateX: 0, translateY: 0});
        }
    }

    render () {
        let gestureResponder = this.gestureResponder;

        let images = this.props.images;
        if (!images) {
            images = [];
        }
        this.pageCount = images.length;

        if (this.pageCount <= 0) {
            gestureResponder = {};
        }

        return (
            <ViewPager
              {...this.props}
              ref={'galleryViewPager'}
              scrollEnabled={false}
              renderPage={this.renderPage}
              pageDataArray={images}
              {...gestureResponder}
              onPageSelected={this.onPageSelected}
              onPageScrollStateChanged={this.onPageScrollStateChanged}
              onPageScroll={this.onPageScroll}
              removeClippedSubviews={ this.props.removeClippedSubviews }
              initialListSize={ this.props.initialListSize }
            />
        );
    }
}
