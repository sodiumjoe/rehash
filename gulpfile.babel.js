import _ from 'lodash';
import del from 'del';
import ecstatic from 'ecstatic';
import gulp from 'gulp';
import gutil from 'gulp-util';
import { Server } from 'karma';
import path from 'path';
import runSequence from 'run-sequence';
import webpack from 'webpack';

const PORT = 8899;
const SRC_DIR = path.join(__dirname, 'src');
const BUILD_DIR = 'dist';
const BUNDLE_DIR = path.join(BUILD_DIR, 'bundle');
const DEV_DIR = path.join(BUILD_DIR, 'dev');
const TEST_DIR = path.join(BUILD_DIR, 'test');

const libCompiler = webpack({
  devtool: 'source-map',
  entry: [
    path.join(SRC_DIR, 'index.js')
  ],
  resolve: {
    extensions: ['', '.js']
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index.js',
    library: 'rehash',
    libraryTarget: 'commonjs2'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          presets: ['react', 'es2015']
        }
      }
    ]
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin()
  ]
});

const exampleCompiler = webpack({
  devtool: 'source-map',
  entry: [
    path.join(SRC_DIR, 'example.jsx')
  ],
  resolve: {
    extensions: ['', '.jsx', '.js']
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'example.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          presets: ['react', 'es2015']
        }
      }
    ]
  }
});

gulp.task('default', ['dev']);

gulp.task('prepublish', cb => runSequence('clean', 'test', 'build' , cb));

gulp.task('clean', cb => del(['dist'], cb));

gulp.task('build', cb => {
  libCompiler.run((err, stats) => {
    if (err) {
      throw new gutil.PluginError('webpack', err);
    }
    const errorString = stats.toString({
      hash: false,
      version: false,
      timings: false,
      assets: false,
      chunks: false,
      chunkModules: false,
      modules: false,
      cached: false,
      reasons: false,
      source: false,
      chunkOrigins: false,
      modulesSort: false,
      chunksSort: false,
      assetsSort: false
    });
    if (!_.isEmpty(errorString)) {
      gutil.log('[webpack]', errorString);
    }
    cb();
  });
});

gulp.task('dev', cb => runSequence('clean', ['build', 'build:dev', 'watch', 'server'], cb));

gulp.task('build:dev', cb => {
  exampleCompiler.run((err, stats) => {
    if (err) {
      throw new gutil.PluginError('webpack', err);
    }
    const errorString = stats.toString({
      hash: false,
      version: false,
      timings: false,
      assets: false,
      chunks: false,
      chunkModules: false,
      modules: false,
      cached: false,
      reasons: false,
      source: false,
      chunkOrigins: false,
      modulesSort: false,
      chunksSort: false,
      assetsSort: false
    });
    if (!_.isEmpty(errorString)) {
      gutil.log('[webpack]', errorString);
    }
    cb();
  });
});

gulp.task('server', () => {
  require('http').createServer(ecstatic({
    root: __dirname
  })).listen(PORT);
  console.log(`Server started at http://localhost:${PORT}/`);
});

gulp.task('watch', () => {
  gulp.watch(path.join(SRC_DIR, '**/*.js*'), ['build:dev']);
});

gulp.task('test', done => {
  new Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start();
});

gulp.task('tdd', done => {
  new Server({
    configFile: __dirname + '/karma.conf.js'
  }, done).start();
});
