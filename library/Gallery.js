import React, { Component } from 'react';
import {
  View,
  ScrollView,
  ListView
} from 'react-native';

import Image from 'react-native-transformable-image';
import Scroller from 'react-native-scroller';
import {createResponder} from 'react-native-gesture-responder';

const MIN_FLING_VELOCITY = 0.5;

export default class Gallery extends Component {

  constructor(props) {
    super(props);
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = {
      dataSource: ds.cloneWithRows([]),

      width: 0,
      height: 0
    }

    this.currentPage = 0;
    this.pageCount = 0;

    this.firstLayout = true;
    this.imageRefs = new Map();
    this.scroller = new Scroller(true, this.onScroll.bind(this));

    this.activeHandler;
    this.firstMove = true;
  }

  onScroll(dx, dy, scroller) {
    this.getListViewInstance().scrollTo({x: this.scroller.getCurrX(), animated: false});
    if (dx === 0 && dy === 0 && scroller.isFinished()) {
      this.resetHistoryImageTransform();
    } else {
      this.currentPage = this.getPageByScrollOffset(this.scroller.getCurrX());
    }
  }

  resetHistoryImageTransform() {
    let transformer = this.getImageTransformer(this.currentPage + 1);
    if(transformer) {
      transformer.forceUpdateTransform({scale: 1, translateX: 0, translateY: 0});
    }

    transformer = this.getImageTransformer(this.currentPage - 1);
    if(transformer) {
      transformer.forceUpdateTransform({scale: 1, translateX: 0, translateY: 0});
    }
  }


  updateData(data) {
    this.setState({
      dataSource: this.state.dataSource.cloneWithRows(data),
    });
    this.pageCount = data.length;
  }


  componentWillMount() {
    this.gestureResponder = createResponder({
      onStartShouldSetResponderCapture: (evt, gestureState) => true,
      onStartShouldSetResponder: (evt, gestureState) => {
        return true;
      },
      onResponderGrant: (evt, gestureState) => {
        this.activeImageHandler(evt, gestureState);
      },
      onResponderMove: (evt, gestureState) => {
        if(this.firstMove) {
          this.firstMove = false;
          if(this.shouldScrollListView(evt, gestureState)) {
            this.activeListViewHandler(evt, gestureState);
          }
        }
        this.activeHandler.onMove(evt, gestureState);
      },
      onResponderRelease: (evt, gestureState) => {
        this.activeHandler.onEnd(evt, gestureState);
        this.activeHandler = null;
        this.firstMove = true;
      }
    });

    this.listViewHandler = {
      onStart: (evt, gestureState) => {
        this.scroller.forceFinished(true);
      },
      onMove: (evt, gestureState) => {
        const dx = gestureState.moveX - gestureState.previousMoveX;
        this.scrollByOffset(dx);
      },
      onEnd: (evt, gestureState) => {
        this.settlePage(gestureState.vx);
      }
    }

    this.imageHandler = {
      onStart: ((evt, gestureState) => {
        this.getCurrentImageTransformer().onResponderGrant(evt, gestureState);
      }),
      onMove: (evt, gestureState) => {
        this.getCurrentImageTransformer().onResponderMove(evt, gestureState);
      },
      onEnd: (evt, gestureState) => {
        this.getCurrentImageTransformer().onResponderRelease(evt, gestureState);
      }
    }
  }

  activeImageHandler(evt, gestureState) {
    if(this.activeHandler !== this.imageHandler) {
      if(this.activeHandler === this.listViewHandler) {
        this.listViewHandler.onEnd(evt, gestureState);
      }
      console.log('activeImageHandler...');
      this.activeHandler = this.imageHandler;
      this.imageHandler.onStart(evt, gestureState);
    }
  }

  activeListViewHandler(evt, gestureState) {
    if(this.activeHandler !== this.listViewHandler) {
      if(this.activeHandler === this.imageHandler) {
        this.imageHandler.onEnd(evt, gestureState);
      }
      console.log('activeListViewHandler...');
      this.activeHandler = this.listViewHandler;
      this.listViewHandler.onStart(evt, gestureState)
    }
  }

  shouldScrollListView(evt, gestureState) {
    if(gestureState.numberActiveTouches > 1) {
      return false;
    }
    const viewTransformer = this.getCurrentImageTransformer();
    const space = viewTransformer.getAvailableTranslateSpace();
    const dx = gestureState.moveX - gestureState.previousMoveX;

    if(dx > 0 && space.left <= 0) {
      return true;
    }
    if(dx < 0 && space.right <= 0) {
      return true;
    }
    return false;
  }

  getImageTransformer(page) {
    if(page >= 0 && page < this.pageCount) {
      return this.imageRefs.get(page + '').getViewTransformerInstance();
    }
  }

  getCurrentImageTransformer() {
    return this.getImageTransformer(this.currentPage);
  }

  getListViewInstance() {
    return this.refs['innerListView'];
  }

  render() {
    return (
      <View
        {...this.props}
        style={[this.props.style, {flex: 1}]}
        {...this.gestureResponder}>
        <ListView
          style={{flex: 1}}
          ref='innerListView'
          scrollEnabled={false}
          dataSource={this.state.dataSource}
          renderRow={this.renderRow.bind(this)}
          onLayout={this.onLayout.bind(this)}
          horizontal={true}
          enableEmptySections={true}
        />
      </View>
    );
  }

  renderRow(rowData, sectionID, rowID, highlightRow) {
    console.log('renderRow...rowID=' + rowID);
    return (
      <Image
        ref={this.onRowRef.bind(this, rowID)}
        key={'innerImage#' + rowID}
        style={{width: this.state.width, height: this.state.height}}
        source={{uri: rowData}}/>
    );
  }

  onRowRef(rowID, ref) {
    console.log('ref...rowID=' + rowID + ', ' + ref);
    this.imageRefs.set(rowID, ref);
  }

  onLayout(e) {
    console.log('onLayout...' + JSON.stringify(e.nativeEvent.layout));
    let {width, height} = e.nativeEvent.layout;
    let sizeChanged = this.state.width !== width || this.state.height !== height;
    if (width && height && sizeChanged) {
      this.setState({
        width, height
      });
      if (this.firstLayout) {
        this.firstLayout = false;
        this.updateData(this.props.images);
      }
    }
  }

  getPageByScrollOffset(x) {
    let page = Math.floor(x / this.state.width + 0.5);
    page = Math.min(this.pageCount-1, page);
    page = Math.max(0, page);
    return page;
  }

  settlePage(vx) {
    if (vx < -MIN_FLING_VELOCITY) {
      if (this.currentPage < this.pageCount - 1) {
        this.flingToPage(this.currentPage + 1, vx);
      } else {
        this.flingToPage(this.pageCount - 1, vx);
      }
    } else if(vx > MIN_FLING_VELOCITY) {
      if (this.currentPage > 0) {
        this.flingToPage(this.currentPage - 1, vx);
      } else {
        this.flingToPage(0, vx);
      }
    } else {
      this.scrollToPage(this.getPageByScrollOffset(this.scroller.getCurrX()));
    }
  }

  getScrollOffsetOfPage(page) {
    return page * this.state.width;
  }

  flingToPage(page, velocityX) {
    velocityX *= -1000; //per sec

    const finalX = this.getScrollOffsetOfPage(page);
    this.scroller.fling(this.scroller.getCurrX(), 0, velocityX, 0, finalX, finalX, 0, 0);
  }

  scrollToPage(page) {
    const finalX = this.getScrollOffsetOfPage(page);
    this.scroller.startScroll(this.scroller.getCurrX(), 0, finalX - this.scroller.getCurrX(), 0, 200);
  }

  scrollByOffset(dx) {
    this.scroller.startScroll(this.scroller.getCurrX(), 0, -dx, 0, 0);
  }
}