import React from 'react';
import {View, ActivityIndicator} from 'react-native';

const ActivityIndicatorComponent = (props) => {
    return (
        <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }}>
            <ActivityIndicator {...props} />
        </View>
    );
};

ActivityIndicatorComponent.propTypes = ActivityIndicator.propTypes;

export default ActivityIndicatorComponent;
