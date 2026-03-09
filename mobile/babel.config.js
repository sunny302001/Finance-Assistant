module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      'nativewind/babel',
      '@babel/plugin-proposal-decorators',
      ['@babel/plugin-proposal-class-properties', { loose: true }],
    ],
  };
};
