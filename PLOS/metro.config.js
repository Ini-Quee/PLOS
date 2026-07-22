const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure react-native-web is used on web
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native': 'react-native-web',
};

module.exports = config;
