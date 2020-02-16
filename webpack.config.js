const webpack = require('webpack');
const path = require('path');

module.exports = {
  mode: 'production',
  entry: './__test__/dsl/react.js',
  output: {
    path: path.join(__dirname, '/__test__/dsl'),
    filename: 'js-bundle.js'
  },
  module: {
    rules: [
        {
            test: /\.js$/,
            loader: 'babel-loader',
            exclude: /node_modules/
        }
    ]
  },
  plugins: [
    new webpack.ProgressPlugin(),
  ]
};