'use strict';

import React, { Component } from 'react';
import {
  Text,
  View,
  Dimensions,
  ScrollView
} from 'react-native';

import Gallery from 'react-native-gallery';

export default class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      showCommentBox: true,
      page: 0
    }
  }

  render() {
    let commentBox;
    if(this.state.showCommentBox) {
      commentBox = (
        <View
          style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 100, backgroundColor: '#00000066', padding: 10, alignItems: 'center', justifyContent: 'center'}}>
          <Text style={{color: 'white'}}>What a nice holiday you have!</Text>
          <Text style={{color: 'white'}}>page: {this.state.page}</Text>
        </View>
      );
    }

    return (
      <View style={{flex: 1}}>
        <Gallery
          style={{flex: 1, backgroundColor: 'black'}}
          initialPage={1}
          pageMargin={10}
          images={[
          'http://p10.qhimg.com/t019e9cf51692f735be.jpg',
          'http://ww2.sinaimg.cn/mw690/714a59a7tw1dxqkkg0cwlj.jpg',
          'http://www.bz55.com/uploads/allimg/150122/139-150122145421.jpg'
        ]}
          onSingleTapConfirmed={() => {
          this.toggleCommentBox();
        }}
          onGalleryStateChanged={(idle) => {
          if(!idle) {
            this.hideCommentBox();
          }
        }}
          onPageSelected={(page) => {
           this.setState({page});
        }}
        />

        {commentBox}
      </View>
    );
  }

  toggleCommentBox() {
    if(!this.state.showCommentBox) {
      this.setState({
        showCommentBox: true
      });
    } else {
      this.setState({
        showCommentBox: false
      });
    }
  }

  hideCommentBox() {
    if(this.state.showCommentBox) {
      this.setState({
        showCommentBox: false
      });
    }
  }
}