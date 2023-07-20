const { override, addLessLoader , addWebpackModuleRule} = require('customize-cra');

module.exports = override(
  addLessLoader({
    strictMath: true,
    noIeCompat: true,
    localIdentName: "[local]--[hash:base64:5]"
  }),
  addWebpackModuleRule({
    test: [/\.css$/, /\.less$/],
    use: ['style-loader', 'css-loader', 'postcss-loader', { loader: 'less-loader' }]
  })
);