import React, { PureComponent } from 'react';
import { View } from 'react-native';
import { ViewPropTypes } from 'deprecated-react-native-prop-types';
import PropTypes from 'prop-types';
import { createResponder } from './libraries/GestureResponder';
import TransformableImage from './libraries/TransformableImage';
import ViewPager from './libraries/ViewPager';

const DEFAULT_FLAT_LIST_PROPS = {
    windowSize: 3
};

export default class Gallery extends PureComponent {
    static propTypes = {
        ...View.propTypes,
        images: PropTypes.arrayOf(PropTypes.object),
        initialPage: PropTypes.number,
        scrollViewStyle: ViewPropTypes ? ViewPropTypes.style : View.propTypes.style,
        pageMargin: PropTypes.number,
        onPageSelected: PropTypes.func,
        onPageScrollStateChanged: PropTypes.func,
        onPageScroll: PropTypes.func,
        onSingleTapConfirmed: PropTypes.func,
        onGalleryStateChanged: PropTypes.func,
        onLongPress: PropTypes.func,
        removeClippedSubviews: PropTypes.bool,
        imageComponent: PropTypes.func,
        errorComponent: PropTypes.func,
        flatListProps: PropTypes.object
    };

    static defaultProps = {
        removeClippedSubviews: true,
        imageComponent: undefined,
        scrollViewStyle: {},
        flatListProps: DEFAULT_FLAT_LIST_PROPS
    };

    imageRefs = new Map();
    activeResponder = undefined;
    firstMove = true;
    currentPage = 0;
    pageCount = 0;
    gestureResponder = undefined;

    constructor (props) {
        super(props);

        this.renderPage = this.renderPage.bind(this);
        this.onPageSelected = this.onPageSelected.bind(this);
        this.onPageScrollStateChanged = this.onPageScrollStateChanged.bind(this);
        this.getViewPagerInstance = this.getViewPagerInstance.bind(this);
        this.getCurrentImageTransformer = this.getCurrentImageTransformer.bind(this);
        this.getImageTransformer = this.getImageTransformer.bind(this);
        this.getViewPagerInstance = this.getViewPagerInstance.bind(this);
        this.activeImageResponder = this.activeImageResponder.bind(this);
    }

    componentWillMount () {
        let onResponderReleaseOrTerminate = (evt, gestureState) => {
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
        };

        this.gestureResponder = createResponder({
            onStartShouldSetResponderCapture: (evt, gestureState) => true,
            onStartShouldSetResponder: (evt, gestureState) => true,
            onResponderGrant: this.activeImageResponder,
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
            onResponderRelease: onResponderReleaseOrTerminate,
            onResponderTerminate: onResponderReleaseOrTerminate,
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
                const currentImageTransformer = this.getCurrentImageTransformer();
                currentImageTransformer && currentImageTransformer.onResponderGrant(evt, gestureState);
                if (this.props.onLongPress) {
                    this._longPressTimeout = setTimeout(() => {
                        this.props.onLongPress(gestureState);
                    }, 600);
                }
            },
            onMove: (evt, gestureState) => {
                const currentImageTransformer = this.getCurrentImageTransformer();
                currentImageTransformer && currentImageTransformer.onResponderMove(evt, gestureState);
                clearTimeout(this._longPressTimeout);
            },
            onEnd: (evt, gestureState) => {
                const currentImageTransformer = this.getCurrentImageTransformer();
                currentImageTransformer && currentImageTransformer.onResponderRelease(evt, gestureState);
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
        if (!viewTransformer) {
            return false;
        }

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
            let ref = this.imageRefs.get(page);
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

    renderPage (pageData, pageId) {
        const { onViewTransformed, onTransformGestureReleased, errorComponent, imageComponent } = this.props;
        return (
            <TransformableImage
              onViewTransformed={((transform) => {
                  onViewTransformed && onViewTransformed(transform, pageId);
              })}
              onTransformGestureReleased={((transform) => {
                  // need the 'return' here because the return value is checked in ViewTransformer
                  return onTransformGestureReleased && onTransformGestureReleased(transform, pageId);
              })}
              ref={((ref) => { this.imageRefs.set(pageId, ref); })}
              key={'innerImage#' + pageId}
              errorComponent={errorComponent}
              imageComponent={imageComponent}
              image={pageData}
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

        const flatListProps = {...DEFAULT_FLAT_LIST_PROPS, ...this.props.flatListProps};

        return (
            <ViewPager
              {...this.props}
              flatListProps={flatListProps}
              ref={'galleryViewPager'}
              scrollViewStyle={this.props.scrollViewStyle}
              scrollEnabled={false}
              renderPage={this.renderPage}
              pageDataArray={images}
              {...gestureResponder}
              onPageSelected={this.onPageSelected}
              onPageScrollStateChanged={this.onPageScrollStateChanged}
              onPageScroll={this.props.onPageScroll}
              removeClippedSubviews={this.props.removeClippedSubviews}
            />
        );
    }
}
