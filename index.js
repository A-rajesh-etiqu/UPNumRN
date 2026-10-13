import './polyfill';
import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';

import React from 'react';
import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('main', () => App);

if (typeof document !== 'undefined') {
    const rootTag = document.getElementById('root');

    AppRegistry.runApplication('main', {
        rootTag,
    });
}