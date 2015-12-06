module.exports = function(config) {
  config.set({
    files: [{ pattern: '**/*.js', watched: false, included: true, served: true }],
    basePath: './test',
    frameworks: ['mocha'],
    reporters: ['nyan'],
    client: {
      mocha: {
        reporter: 'html',
        ui: 'bdd'
      }
    },
    browsers: ['Chrome'],
    preprocessors: {
      '**/*js': ['webpack', 'sourcemap']
    },

    webpack: {
      devtool: 'inline-source-map',
      resolve: {
        extensions: ['', '.jsx', '.js']
      },
      module: {
        loaders: [
          {
            test: /\.jsx?$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel',
            query: {
              presets: ['es2015']
            }
          }
        ]
      }
    },

    webpackMiddleware: {
      noInfo: true
    },

    plugins: [
      require('karma-webpack'),
      require('karma-mocha'),
      require('karma-chrome-launcher'),
      require('karma-nyan-reporter'),
      require('karma-sourcemap-loader')
    ]

  });
};
