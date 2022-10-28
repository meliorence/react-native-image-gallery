import React, { PureComponent } from 'react';
import {
    View,
    FlatList,
    InteractionManager,
    Dimensions
} from 'react-native';
import { ViewPropTypes } from 'deprecated-react-native-prop-types';
import PropTypes from 'prop-types';
import Scroller from '../Scroller';
import { createResponder } from '../GestureResponder';

const MIN_FLING_VELOCITY = 0.5;

// Dimensions are only used initially.
// onLayout should handle orientation swap.
const { width, height } = Dimensions.get('window');

export default class ViewPager extends PureComponent {
    static propTypes = {
        ...View.propTypes,
        initialPage: PropTypes.number,
        pageMargin: PropTypes.number,
        scrollViewStyle: ViewPropTypes ? ViewPropTypes.style : View.propTypes.style,
        scrollEnabled: PropTypes.bool,
        renderPage: PropTypes.func,
        pageDataArray: PropTypes.array,
        initialListSize: PropTypes.number,
        removeClippedSubviews: PropTypes.bool,
        onPageSelected: PropTypes.func,
        onPageScrollStateChanged: PropTypes.func,
        onPageScroll: PropTypes.func,
        flatListProps: PropTypes.object
    };

    static defaultProps = {
        initialPage: 0,
        pageMargin: 0,
        scrollEnabled: true,
        pageDataArray: [],
        initialListSize: 10,
        removeClippedSubviews: true,
        flatListProps: {}
    };

    currentPage = undefined; // Do not initialize to make onPageSelected(0) be dispatched
    layoutChanged = false;
    activeGesture = false;
    gestureResponder = undefined;

    state = { width, height };

    constructor (props) {
        super(props);

        this.onLayout = this.onLayout.bind(this);
        this.renderRow = this.renderRow.bind(this);
        this.onResponderGrant = this.onResponderGrant.bind(this);
        this.onResponderMove = this.onResponderMove.bind(this);
        this.onResponderRelease = this.onResponderRelease.bind(this);
        this.getItemLayout = this.getItemLayout.bind(this);

        this.scroller = this.createScroller();
    }

    createScroller () {
        return new Scroller(true, (dx, dy, scroller) => {
            if (dx === 0 && dy === 0 && scroller.isFinished()) {
                if (!this.activeGesture) {
                    this.onPageScrollStateChanged('idle');
                }
            } else {
                const curX = this.scroller.getCurrX();
                this.refs['innerFlatList'] && this.refs['innerFlatList'].scrollToOffset({ offset: curX, animated: false });

                let position = Math.floor(curX / (this.state.width + this.props.pageMargin));
                position = this.validPage(position);
                let offset = (curX - this.getScrollOffsetOfPage(position)) / (this.state.width + this.props.pageMargin);
                let fraction = (curX - this.getScrollOffsetOfPage(position) - this.props.pageMargin) / this.state.width;
                if (fraction < 0) {
                    fraction = 0;
                }
                this.props.onPageScroll && this.props.onPageScroll({
                    position, offset, fraction
                });
            }
        });
    }

    componentWillMount () {
        this.gestureResponder = createResponder({
            onStartShouldSetResponder: (evt, gestureState) => true,
            onResponderGrant: this.onResponderGrant,
            onResponderMove: this.onResponderMove,
            onResponderRelease: this.onResponderRelease,
            onResponderTerminate: this.onResponderRelease
        });
    }

    componentDidMount () {
        // FlatList is set to render at initialPage.
        // The scroller we use is not aware of this.
        // Let it know by simulating most of what happens in scrollToPage()
        this.onPageScrollStateChanged('settling');

        const page = this.validPage(this.props.initialPage);
        this.onPageChanged(page);

        const finalX = this.getScrollOffsetOfPage(page);
        this.scroller.startScroll(this.scroller.getCurrX(), 0, finalX - this.scroller.getCurrX(), 0, 0);
        
        requestAnimationFrame(() => {
            // this is here to work around a bug in FlatList, as discussed here
            // https://github.com/facebook/react-native/issues/1831
            // (and solved here https://github.com/facebook/react-native/commit/03ae65bc ?)
            this.scrollByOffset(1);
            this.scrollByOffset(-1);
        });
    }

    componentDidUpdate (prevProps) {
        if (this.layoutChanged) {
            this.layoutChanged = false;
            if (typeof this.currentPage === 'number') {
                this.scrollToPage(this.currentPage, true);
            }
        } else if (this.currentPage + 1 >= this.props.pageDataArray.length &&
            this.props.pageDataArray.length !== prevProps.pageDataArray.length) {
            this.scrollToPage(this.props.pageDataArray.length, true);
        }
    }

    onLayout (e) {
        let { width, height } = e.nativeEvent.layout;
        let sizeChanged = this.state.width !== width || this.state.height !== height;
        if (width && height && sizeChanged) {
            this.layoutChanged = true;
            this.setState({ width, height });
        }
    }

    onResponderGrant (evt, gestureState) {
        // this.scroller.forceFinished(true);
        this.activeGesture = true;
        this.onPageScrollStateChanged('dragging');
    }

    onResponderMove (evt, gestureState) {
        let dx = gestureState.moveX - gestureState.previousMoveX;
        this.scrollByOffset(dx);
    }

    onResponderRelease (evt, gestureState, disableSettle) {
        this.activeGesture = false;
        if (!disableSettle) {
            this.settlePage(gestureState.vx);
        }
    }

    onPageChanged (page) {
        if (this.currentPage !== page) {
            this.currentPage = page;
            this.props.onPageSelected && this.props.onPageSelected(page);
        }
    }

    onPageScrollStateChanged (state) {
        this.props.onPageScrollStateChanged && this.props.onPageScrollStateChanged(state);
    }

    settlePage (vx) {
        const { pageDataArray } = this.props;

        if (vx < -MIN_FLING_VELOCITY) {
            if (this.currentPage < pageDataArray.length - 1) {
                this.flingToPage(this.currentPage + 1, vx);
            } else {
                this.flingToPage(pageDataArray.length - 1, vx);
            }
        } else if (vx > MIN_FLING_VELOCITY) {
            if (this.currentPage > 0) {
                this.flingToPage(this.currentPage - 1, vx);
            } else {
                this.flingToPage(0, vx);
            }
        } else {
            let page = this.currentPage;
            let progress = (this.scroller.getCurrX() - this.getScrollOffsetOfPage(this.currentPage)) / this.state.width;
            if (progress > 1 / 3) {
                page += 1;
            } else if (progress < -1 / 3) {
                page -= 1;
            }
            page = Math.min(pageDataArray.length - 1, page);
            page = Math.max(0, page);
            this.scrollToPage(page);
        }
    }

    getScrollOffsetOfPage (page) {
        return this.getItemLayout(this.props.pageDataArray, page).offset;
    }

    flingToPage (page, velocityX) {
        this.onPageScrollStateChanged('settling');

        page = this.validPage(page);
        this.onPageChanged(page);

        velocityX *= -1000; // per sec
        const finalX = this.getScrollOffsetOfPage(page);
        this.scroller.fling(this.scroller.getCurrX(), 0, velocityX, 0, finalX, finalX, 0, 0);
    }

    scrollToPage (page, immediate) {
        this.onPageScrollStateChanged('settling');

        page = this.validPage(page);
        this.onPageChanged(page);

        const finalX = this.getScrollOffsetOfPage(page);
        if (immediate) {
            InteractionManager.runAfterInteractions(() => {
                this.scroller.startScroll(this.scroller.getCurrX(), 0, finalX - this.scroller.getCurrX(), 0, 0);
                this.refs['innerFlatList'] && this.refs['innerFlatList'].scrollToOffset({offset: finalX, animated: false});
                this.refs['innerFlatList'] && this.refs['innerFlatList'].recordInteraction();
            });
        } else {
            this.scroller.startScroll(this.scroller.getCurrX(), 0, finalX - this.scroller.getCurrX(), 0, 400);
        }
    }

    scrollByOffset (dx) {
        this.scroller.startScroll(this.scroller.getCurrX(), 0, -dx, 0, 0);
    }

    validPage (page) {
        page = Math.min(this.props.pageDataArray.length - 1, page);
        page = Math.max(0, page);
        return page;
    }

    getScrollOffsetFromCurrentPage () {
        return this.scroller.getCurrX() - this.getScrollOffsetOfPage(this.currentPage);
    }

    getItemLayout (data, index) {
        // this method is called 'getItemLayout', but it is not actually used
        // as the 'getItemLayout' function for the FlatList. We use it within
        // the code on this page though. The reason for this is that working
        // with 'getItemLayout' for FlatList is buggy. You might end up with
        // unrendered / missing content. Therefore we work around it, as
        // described here
        // https://github.com/facebook/react-native/issues/15734#issuecomment-330616697
        return {
            length: this.state.width + this.props.pageMargin,
            offset: (this.state.width + this.props.pageMargin) * index,
            index
        };
    }

    keyExtractor (item, index) {
        return index;
    }

    renderRow ({ item, index }) {
        const { width, height } = this.state;
        let page = this.props.renderPage(item, index);

        const layout = {
            width,
            height,
            position: 'relative'
        };
        const style = page.props.style ? [page.props.style, layout] : layout;

        let newProps = { ...page.props, ref: page.ref, style };
        const element = React.createElement(page.type, newProps);

        if (this.props.pageMargin > 0 && index > 0) {
            // Do not using margin style to implement pageMargin.
            // The ListView seems to calculate a wrong width for children views with margin.
            return (
                <View style={{
                    width: width + this.props.pageMargin,
                    height: height,
                    alignItems: 'flex-end'
                }}>
                    { element }
                </View>
            );
        } else {
            return element;
        }
    }

    render () {
        const { width, height } = this.state;
        const { pageDataArray, scrollEnabled, style, scrollViewStyle } = this.props;

        if (width && height) {
            let list = pageDataArray;
            if (!list) {
                list = [];
            }
        }

        let gestureResponder = this.gestureResponder;
        if (!scrollEnabled || pageDataArray.length <= 0) {
            gestureResponder = {};
        }

        return (
            <View
              {...this.props}
              style={[style, { flex: 1 }]}
              {...gestureResponder}>
                <FlatList
                  {...this.props.flatListProps}
                  style={[{ flex: 1 }, scrollViewStyle]}
                  ref={'innerFlatList'}
                  keyExtractor={this.keyExtractor}
                  scrollEnabled={false}
                  horizontal={true}
                  data={pageDataArray}
                  renderItem={this.renderRow}
                  onLayout={this.onLayout}

                  // use contentOffset instead of initialScrollIndex so that we don't have
                  // to use the buggy 'getItemLayout' prop. See
                  // https://github.com/facebook/react-native/issues/15734#issuecomment-330616697 and
                  // https://github.com/facebook/react-native/issues/14945#issuecomment-354651271
                  contentOffset = {{x: this.getScrollOffsetOfPage(parseInt(this.props.initialPage)), y:0}}
              />
            </View>
        );
    }
}
