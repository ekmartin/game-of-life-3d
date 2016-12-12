const { resolve } = require('path');
const webpack = require('webpack');

const getEntry = dev => {
  const result = dev ? [
    'webpack-dev-server/client?http://localhost:3000',
    'webpack/hot/only-dev-server'
  ] : [];

  return result.concat('./index.js');
};

module.exports = (options = {}) => ({
  entry: getEntry(options.dev),
  output: {
    filename: 'bundle.js',
    path: resolve(__dirname, 'public'),
    publicPath: '/'
  },
  devtool: options.dev ? 'inline-source-map' : 'cheap-module-source-map',
  devServer: {
    hot: true,
    port: 3000,
    contentBase: 'public',
    publicPath: '/'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel-loader'],
        exclude: /node_modules/
      },
      {
        test: /\.glsl$/,
        loaders: ['raw-loader']
      }
    ]
  },
  plugins: options.dev ?
    [
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NamedModulesPlugin()
    ] :
    [
      new webpack.optimize.UglifyJsPlugin()
    ]
});
