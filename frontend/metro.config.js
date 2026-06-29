const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // SVG Support
  config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
  config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
  config.resolver.sourceExts.push('svg');

  // Single worker avoids Metro OOM on Windows laptops with 8 GB RAM.
  config.maxWorkers = 1;

  return config;
})();
