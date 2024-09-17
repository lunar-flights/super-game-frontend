const webpack = require("webpack");

module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    process: false,
    buffer: require.resolve("buffer/"),
  };

  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
  ];

  return config;
};
