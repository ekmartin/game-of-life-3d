const { resolve } = require('path');
const webpack = require('webpack');

module.exports = (options = {}) => ({
  entry: [
    'webpack-dev-server/client?http://localhost:3000',
    'webpack/hot/only-dev-server',
    './index.js'
  ],
  output: {
    filename: 'bundle.js',
    path: resolve(__dirname, 'public'),
    publicPath: '/'
  },
  context: resolve(__dirname, 'src'),
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
