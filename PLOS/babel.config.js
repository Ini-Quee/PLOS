module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['module:expo/node_modules/babel-preset-expo'],
    plugins: [],
  };
};
