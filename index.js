/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry, Platform } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

if (Platform.OS === 'web') {
    // Inject vector icons font for web
    const iconFont = require('react-native-vector-icons/Fonts/Ionicons.ttf');
    const iconFontStyles = `@font-face {
        src: url(${iconFont});
        font-family: Ionicons;
    }`;
    const style = document.createElement('style');
    style.type = 'text/css';
    if (style.styleSheet) {
        style.styleSheet.cssText = iconFontStyles;
    } else {
        style.appendChild(document.createTextNode(iconFontStyles));
    }
    document.head.appendChild(style);
}

AppRegistry.registerComponent(appName, () => App);

if (Platform.OS === 'web') {
    const rootTag = document.getElementById('root') || document.getElementById('main');
    AppRegistry.runApplication(appName, { rootTag });
}
