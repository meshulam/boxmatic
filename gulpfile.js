const gulp = require('gulp'),
      del = require('del'),
      babelify = require('babelify'),
      sourcemaps = require('gulp-sourcemaps'),
      source = require('vinyl-source-stream'),
      buffer = require('vinyl-buffer'),
      browserify = require('browserify'),
      watchify = require('watchify')
      browserSync = require('browser-sync').create();

gulp.task('clean', function() {
  return del([ 'dist/*' ]);
});

gulp.task('serve', ['watch'], function() {
  browserSync.init({
    files: [ 'index.html', 'css/app.css', 'dist/boxmaker.js' ],
    server: {
      baseDir: "./"
    }
  });
});

function compile(watch) {
  var bundler = watchify(
    browserify({
      entries: [ './src/main.js' ],
      debug: true,    // Enable source maps
    })
    .transform(babelify.configure({
      presets : ["es2015"]
    }))
  );

  function rebundle() {
    bundler.bundle()
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source('boxmaker.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./dist'));
  }

  if (watch) {
    bundler.on('update', function() {
      console.log('-> bundling...');
      rebundle();
    });
  }

  rebundle();
}

function watch() {
  return compile(true);
};

gulp.task('build', function() { return compile(); });
gulp.task('watch', function() { return watch(); });

gulp.task('default', ['build']);

