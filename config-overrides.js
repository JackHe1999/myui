const { override, addWebpackAlias, addLessLoader, addWebpackModuleRule } = require('customize-cra');
const path = require('path');

module.exports = override(
  addWebpackAlias({
    ['@src']: path.resolve(__dirname, 'src'),
    ['@mycomponents']: path.resolve(__dirname, 'src/mycomponents/index.d.ts'),
  }),
  addLessLoader({
    strictMath: true,
    noIeCompat: true,
    localIdentName: "[local]--[hash:base64:5]"
  }),
  addWebpackModuleRule(
    {
      test: [/\.css$/, /\.less$/],
      use: ['style-loader', 'css-loader', 'postcss-loader', { loader: 'less-loader' }]
    }
  ),
  addWebpackModuleRule(
    {
      test: /\.md$/,
      use: 'raw-loader'
    }
  )
);