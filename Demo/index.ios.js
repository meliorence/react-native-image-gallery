import React, { Component } from 'react';
import { AppRegistry } from 'react-native';
import DemoGallery from './src/DemoGallery';

export default class Demo extends Component {

    render () {
        return (
            <DemoGallery />
        );
    }
}

AppRegistry.registerComponent('Demo', () => Demo);
