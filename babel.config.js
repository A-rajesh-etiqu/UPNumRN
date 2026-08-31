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

  return {
    presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
    plugins,
  };
};
