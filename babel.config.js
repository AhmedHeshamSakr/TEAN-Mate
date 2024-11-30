export default {
    presets: [
      ['@babel/preset-env', {
        targets: {
          browsers: ['last 2 versions', 'chrome >= 90'],
          node: 'current'
        },
        useBuiltIns: 'usage',
        corejs: 3,
        debug: true
      }]
    ],
    plugins: [
      ['@babel/plugin-transform-runtime', {
        corejs: 3,
        helpers: true,
        regenerator: true,
        useESModules: true
      }],
      "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-optional-chaining"
    ]
  };