import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  if (!Platform.constants) {
    // @ts-ignore
    Platform.constants = {};
  }
  if (!Platform.constants.reactNativeVersion) {
    // @ts-ignore
    Platform.constants.reactNativeVersion = { major: 0, minor: 72, patch: 0 };
  }
}
