import _ from 'lodash';
import del from 'del';
import ecstatic from 'ecstatic';
import gulp from 'gulp';
import gulpBabel from 'gulp-babel';
import gutil from 'gulp-util';
import mocha from 'gulp-spawn-mocha';
import path from 'path';
import runSequence from 'run-sequence';
import source from 'vinyl-source-stream';
import webpack from 'webpack';

const PORT = 8899;
const BUILD_DIR = 'dist';
const BUNDLE_DIR = path.join(BUILD_DIR, 'bundle');
const DEV_DIR = path.join(BUILD_DIR, 'dev');
const TEST_DIR = path.join(BUILD_DIR, 'test');

const libCompiler = webpack({
  devtool: 'source-map',
  entry: [
    './src/index'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index.js',
    library: 'rehash',
    libraryTarget: 'commonjs2'
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false
      }
    })
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel'],
      include: path.join(__dirname, 'src')
    }]
  }
});

const exampleCompiler = webpack({
  devtool: 'source-map',
  entry: [
    './src/example'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'example.js'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel'],
      include: path.join(__dirname, 'src')
    }]
  }
});

gulp.task('default', ['dev']);

gulp.task('prepublish', cb => runSequence('clean', 'build' , cb));

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

gulp.task('watch', ['default'], () => {
	gulp.watch(['src/example.js'], ['build:dev']);
	gulp.watch(['src/index.js', 'test/**/*.js'], ['build', 'build:dev', 'test']);
});

gulp.task('build-test', () => {
	return gulp.src('test/**/*.js*')
		.pipe(gulpBabel())
		.pipe(gulp.dest(TEST_DIR));
});

gulp.task('test', ['build', 'build-test'], () => {
	return gulp.src(path.join(TEST_DIR, '**/*spec.js'))
		.pipe(mocha({
			reporter: 'nyan'
		}));
});
