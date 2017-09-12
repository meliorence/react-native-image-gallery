import React, { Component } from 'react';
import Gallery from 'react-native-image-gallery';

export default class DemoGallery extends Component {

    constructor (props) {
        super(props);
        this.state = {
            images: [
                { source: require('./static/images/placehold.jpg'), dimensions: { width: 540, height: 720 } },
                { source: { uri: 'http://wrongdomain.tld/images/wrongimage.jpg' } },
                { source: { uri: 'http://i.imgur.com/gSmWCJF.jpg' } },
                { source: { uri: 'http://i.imgur.com/XP2BE7q.jpg' } },
                { source: { uri: 'http://i.imgur.com/5nltiUd.jpg' } }
            ]
        };
        this.addImages();
        this.removeImages();
    }

    addImages () {
        setInterval(() => {
            const newArray = [...this.state.images, { source: { uri: 'http://i.imgur.com/DYjAHAf.jpg' } }];
            this.setState({ images: newArray });
        }, 5000);
    }

    removeImages () {
        setInterval(() => {
            const newArray = this.state.images.filter((element, index) => index !== 1);
            this.setState({ images: newArray });
        }, 7000);
    }

    render () {
        return (
            <Gallery
              style={{flex: 1, backgroundColor: 'black'}}
              images={this.state.images}
            />
        );
    }
}
