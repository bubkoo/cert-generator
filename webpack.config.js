const webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  output: {
    path: './dist',
    filename: 'index.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    fs: 'fs',
    path: 'path',
    async: 'async',
    rimraf: 'rimraf',
    mkdirp: 'mkdirp',
    'user-home': 'user-home',
    'node-forge': 'node-forge'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'eslint'
      }
    ]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin()
  ],
  devtool: 'source-map'
};
