import React, { Component } from 'react';
import {
  AppRegistry,
} from 'react-native';

import App from './App';

class Demo extends Component {
  render() {
    return (
      <App />
    );
  }
}

AppRegistry.registerComponent('Demo', () => Demo);
