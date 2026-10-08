module.exports = function (api) {
  const isWeb = api.caller((caller) => caller && caller.platform === 'web');
  api.cache(true);

  const plugins = [
    '@babel/plugin-transform-export-namespace-from',
    'babel-plugin-transform-import-meta',
  ];

  if (isWeb) {
    plugins.push([
      'module-resolver',
      {
        alias: {
          'react-native-linear-gradient': 'react-native-web-linear-gradient',
        },
      },
    ]);
  }

  // react-native-reanimated/plugin must be the last one
  plugins.push('react-native-reanimated/plugin');

  return {
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins,
  };
};
