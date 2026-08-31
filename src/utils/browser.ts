import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import { Linking } from 'react-native';

export const maybeCompleteAuthSession = () => {
    // Note: InAppBrowser doesn't have maybeCompleteAuthSession natively,
    // they might have added it in a specific fork, or it's just undefined,
    // let's wrap it in a try-catch or check if it exists.
    if ((InAppBrowser as any).maybeCompleteAuthSession) {
        (InAppBrowser as any).maybeCompleteAuthSession();
    }
};

export const openBrowserAuth = async (url: string, redirectUrl: string) => {
  if (await InAppBrowser.isAvailable()) {
    return await InAppBrowser.openAuth(url, redirectUrl, {
      ephemeralWebSession: false,
    });
  } else {
    Linking.openURL(url);
    return { type: 'cancel' };
  }
};

export const openBrowser = async (url: string) => {
  if (await InAppBrowser.isAvailable()) {
    await InAppBrowser.open(url);
  } else {
    Linking.openURL(url);
  }
};
