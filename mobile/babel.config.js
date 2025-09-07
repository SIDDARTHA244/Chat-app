module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "react-native-reanimated/plugin",  // 👈 needed by Reanimated
      "react-native-worklets/plugin"     // 👈 the one causing your error
    ],
  };
};
