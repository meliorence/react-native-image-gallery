import React, { PropTypes, PureComponent } from 'react';
import {
  View,
  ListView,
  Platform
} from 'react-native';

import Scroller from 'react-native-scroller';
import {createResponder} from 'react-native-gesture-responder';
import TimerMixin from 'react-timer-mixin';
import reactMixin from 'react-mixin';

const MIN_FLING_VELOCITY = 0.5;

const DEV = false;

export default class ViewPager extends PureComponent {

  static propTypes = {
    ...View.propTypes,
    initialPage: PropTypes.number,
    pageMargin: PropTypes.number,
    scrollEnabled: PropTypes.bool,
    renderPage: PropTypes.func,
    pageDataArray: PropTypes.array,
    initialListSize: PropTypes.number,
    removeClippedSubviews: PropTypes.bool,

    onPageSelected: PropTypes.func,
    onPageScrollStateChanged: PropTypes.func,
    onPageScroll: PropTypes.func,
  };

  static defaultProps = {
    initialPage: 0,
    pageMargin: 0,
    scrollEnabled: true,
    pageDataArray: [],
    initialListSize: 10,
    removeClippedSubviews: true,
  };

  pageCount = 0; //Initialize to avoid undefined error
  currentPage = undefined; //Do not initialize to make onPageSelected(0) be dispatched
  layoutChanged = false;
  initialPageSettled = false;
  activeGesture = false;
  gestureResponder = undefined;

  constructor(props) {
    super(props);

    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = {
      width: 0,
      height: 0,
      dataSource: ds.cloneWithRows([])
    }

    this.scroller = new Scroller(true, (dx, dy, scroller) => {
      if (dx === 0 && dy === 0 && scroller.isFinished()) {
        if (!this.activeGesture) {
          this.onPageScrollStateChanged('idle');
        }
      } else {
        const curX = this.scroller.getCurrX();
        this.refs['innerListView'] && this.refs['innerListView'].scrollTo({x: curX, animated: false});

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

  componentWillMount() {
    this.gestureResponder = createResponder({
      onStartShouldSetResponder: (evt, gestureState) => true,
      onResponderGrant: this.onResponderGrant.bind(this),
      onResponderMove: this.onResponderMove.bind(this),
      onResponderRelease: this.onResponderRelease.bind(this),
      onResponderTerminate: this.onResponderRelease.bind(this)
    });
  }

  onResponderGrant(evt, gestureState) {
    this.scroller.forceFinished(true);
    this.activeGesture = true;
    this.onPageScrollStateChanged('dragging');
  }

  onResponderMove(evt, gestureState) {
    let dx = gestureState.moveX - gestureState.previousMoveX;
    this.scrollByOffset(dx);
  }

  onResponderRelease(evt, gestureState, disableSettle) {
    this.activeGesture = false;
    if (!disableSettle) {
      this.settlePage(gestureState.vx);
    }
  }

  render() {
    let dataSource = this.state.dataSource;
    if (this.state.width && this.state.height) {
      let list = this.props.pageDataArray;
      if (!list) {
        list = [];
      }
      dataSource = dataSource.cloneWithRows(list);
      this.pageCount = list.length;
    }

    let gestureResponder = this.gestureResponder;
    if (!this.props.scrollEnabled || this.pageCount <= 0) {
      gestureResponder = {};
    }

    return (
      <View
        {...this.props}
        style={[this.props.style, {flex: 1}]}
        {...gestureResponder}>
        <ListView
          style={{flex: 1}}
          ref='innerListView'
          scrollEnabled={false}
          horizontal={true}
          enableEmptySections={true}
          dataSource={dataSource}
          renderRow={this.renderRow.bind(this)}
          onLayout={this.onLayout.bind(this)}
          removeClippedSubviews={ this.props.removeClippedSubviews }
          initialListSize={ this.props.initialListSize }
        />
      </View>
    );
  }

  renderRow(rowData, sectionID, rowID, highlightRow) {
    DEV && console.log(`ViewPager:renderRow ${rowID}`);
    const {width, height} = this.state;
    let page = this.props.renderPage(rowData, rowID);

    const layout = {
      width: width,
      height: height,
      position: 'relative',
    }
    const style = page.props.style ?
    (
        [page.props.style, layout]
    )
    : layout;

    let newProps = {
      ...page.props,
      ref: page.ref,
      style
    };
    const element = React.createElement(page.type, newProps);

    if (this.props.pageMargin > 0 && rowID > 0) {
      //Do not using margin style to implement pageMargin. The ListView seems to calculate a wrong width for children views with margin.
      return (
        <View style={{width: width + this.props.pageMargin, height: height, alignItems: 'flex-end'}}>
          {element}
        </View>
      );
    } else {
      return element;
    }
  }

  onLayout(e) {
    let {width, height} = e.nativeEvent.layout;
    let sizeChanged = this.state.width !== width || this.state.height !== height;
    if (width && height && sizeChanged) {
      //if layout changed, create a new DataSource instance to trigger renderRow
      this.layoutChanged = true;
      this.setState({
        width, height,
        dataSource: (new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})).cloneWithRows([])
      });
    }
  }

  componentDidUpdate() {
    if (!this.initialPageSettled) {
      this.initialPageSettled = true;
      if (Platform.OS === 'ios') {
        this.scrollToPage(this.props.initialPage, true);
      } else {
        //A trick to solve bugs on Android. Delay a little
        setTimeout(this.scrollToPage.bind(this, this.props.initialPage, true), 0);
      }
    } else if (this.layoutChanged) {
      this.layoutChanged = false;
      if (typeof this.currentPage === 'number') {
        if (Platform.OS === 'ios') {
          this.scrollToPage(this.currentPage, true);
        } else {
          //A trick to solve bugs on Android. Delay a little
          setTimeout(this.scrollToPage.bind(this, this.currentPage, true), 0);
        }
      }
    }
  }

  settlePage(vx) {
    if (vx < -MIN_FLING_VELOCITY) {
      if (this.currentPage < this.pageCount - 1) {
        this.flingToPage(this.currentPage + 1, vx);
      } else {
        this.flingToPage(this.pageCount - 1, vx);
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
      page = Math.min(this.pageCount - 1, page);
      page = Math.max(0, page);
      this.scrollToPage(page);
    }
  }

  getScrollOffsetOfPage(page) {
    return page * (this.state.width + this.props.pageMargin);
  }

  flingToPage(page, velocityX) {
    this.onPageScrollStateChanged('settling');

    page = this.validPage(page);
    this.onPageChanged(page);

    velocityX *= -1000; //per sec
    const finalX = this.getScrollOffsetOfPage(page);
    this.scroller.fling(this.scroller.getCurrX(), 0, velocityX, 0, finalX, finalX, 0, 0);

  }

  scrollToPage(page, immediate) {
    this.onPageScrollStateChanged('settling');

    page = this.validPage(page);
    this.onPageChanged(page);

    const finalX = this.getScrollOffsetOfPage(page);
    if (immediate) {
      this.scroller.startScroll(this.scroller.getCurrX(), 0, finalX - this.scroller.getCurrX(), 0, 0);
    } else {
      this.scroller.startScroll(this.scroller.getCurrX(), 0, finalX - this.scroller.getCurrX(), 0, 400);
    }

  }

  onPageChanged(page) {
    if (this.currentPage !== page) {
      this.currentPage = page;
      this.props.onPageSelected && this.props.onPageSelected(page);
    }
  }

  onPageScrollStateChanged(state) {
    this.props.onPageScrollStateChanged && this.props.onPageScrollStateChanged(state);
  }

  scrollByOffset(dx) {
    this.scroller.startScroll(this.scroller.getCurrX(), 0, -dx, 0, 0);
  }

  validPage(page) {
    page = Math.min(this.pageCount - 1, page);
    page = Math.max(0, page);
    return page;
  }

  /**
   * A helper function to scroll to a specific page in the ViewPager.
   * @param page
   * @param immediate If true, the transition between pages will not be animated.
   */
  setPage(page, immediate) {
    this.scrollToPage(page, immediate);
  }

  getScrollOffsetFromCurrentPage() {
    return this.scroller.getCurrX() - this.getScrollOffsetOfPage(this.currentPage);
  }
}

/**
 * Keep in mind that if you use ES6 classes for your React components there is no built-in API for mixins. To use TimerMixin with ES6 classes, we recommend react-mixin.
 * Refer to 'https://facebook.github.io/react-native/docs/timers.html#content'
 */
reactMixin(ViewPager.prototype, TimerMixin);
