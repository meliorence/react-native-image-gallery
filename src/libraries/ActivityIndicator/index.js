import React from 'react';
import {View, Platform, ActivityIndicator} from 'react-native';
import PropTypes from 'prop-types';

const DEFAULT_LOADER_SIZE = Platform.OS === 'ios' ? 'large' : 50;

const ActivityIndicatorComponent = (props) => {
    return (
        <View style={{
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }}>
            <ActivityIndicator size={DEFAULT_LOADER_SIZE} {...props}/>
        </View>
    );
};

ActivityIndicatorComponent.propTypes = ActivityIndicator.propTypes;

export default ActivityIndicatorComponent;
