export const maybeCompleteAuthSession = () => {};

export const openBrowserAuth = async (url: string, redirectUrl: string) => {
  (globalThis as any).window.open(url, '_self');
  return { type: 'success' };
};

export const openBrowser = async (url: string) => {
  (globalThis as any).window.open(url, '_blank');
};
