import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import del from 'del';
import browserSync from 'browser-sync';
import watchify from 'watchify';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import babelify from 'babelify';
import buffer from 'vinyl-buffer';
import runSequence from 'run-sequence';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

// Build vars
const BUILD = {
  PRODUCTION: false,
}

const BROWSERIFY_OPTS = {
  entries: [ './app/scripts/main.js' ],
  debug: true,    // Enable source maps
  transform: [['babelify', { ignore: ['./app/scripts/vendor/**'] }]],
}

// Extra options to add to browserify so watchify gets wired
const WATCHIFY_OPTS = Object.assign({}, watchify.args, BROWSERIFY_OPTS);

const TEST_OPTS = Object.assign({}, WATCHIFY_OPTS, {
  entries: [ './test/scripts/main.js' ]
});

gulp.task('clean', function() {
  return del(['.tmp', 'dist/*', '!dist/.git'], {dot: true});
});

// Serve dev files and reload on change
gulp.task('serve', ['styles', 'scripts'], function() {
  browserSync({
    notify: false,
    // Allow scroll syncing across breakpoints
    scrollElementMapping: ['main', '.mdl-layout'],
    // https: true,
    server: ['.tmp', 'app'],
    port: 5000
  });

  // Watch built JS since browserify handles the watching
  gulp.watch('.tmp/scripts/**/*.js', reload);

  gulp.watch('app/**/*.html', reload);
  gulp.watch(['app/styles/**/*.{scss,css}'], ['styles', reload]);
  gulp.watch(['app/images/**/*'], reload);
});

// Serve prod from the dist dir
gulp.task('serve:prod', ['default'], function() {
  browserSync({
    notify: false,
    scrollElementMapping: ['main', '.mdl-layout'],
    server: 'dist',
    port: 5001
  })
});

gulp.task('icon', function() {
  return gulp.src(['app/icon/**/*'])
    .pipe(gulp.dest('dist/icon'))
    .pipe($.size({title: 'favicon'}))
})

gulp.task('vendor', function() {
  return gulp.src(['app/vendor/**/*'])
    .pipe(gulp.dest('dist/vendor'))
    .pipe($.size({title: 'vendor'}))
})

gulp.task('copy', function() {
  return gulp.src([
    'app/*',
    '!app/*.html',
  ], {dot: true})
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'copy'}))
})

// production HTML transform
gulp.task('html', function() {
  return gulp.src('app/**/*.html')
    .pipe($.useref({
      searchPath: '{.tmp,app}',
      noAssets: true,
    }))

    .pipe($.if('*.html', $.htmlmin({
      removeComments: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      removeOptionalTags: true
    })))
    .pipe($.if('*.html', $.size({title: 'html', showFiles: true})))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', function() {
  gulp.src('app/images/**/*')
    .pipe($.if(['*.png', '*.svg', '*.jpg'], gulp.dest('dist/images')))
});

gulp.task('styles', function() {
  return gulp.src([
    'app/styles/**/*.css',
  ])
    .pipe($.newer('./tmp/styles'))
    .pipe($.sourcemaps.init())
    //.pipe($.autoprefixer(AUTOPREFIX_BROWSERS))
    //.pipe(gulp.dest('.tmp/styles'))   // What's this for?
    .pipe($.if('*.css', $.cssnano()))
    .pipe($.size({title: 'styles'}))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(gulp.dest('dist/styles'))
});

const testWatcher = watchify(browserify(TEST_OPTS));
testWatcher.name = 'testWatcher';
testWatcher.on('update', () => bundle(testWatcher));

gulp.task('serve:test', ['clean'], function() {
  return bundle(testWatcher)
    .on('finish', () => {
      browserSync({
        notify: false,
        // Allow scroll syncing across breakpoints
        scrollElementMapping: ['main', '.mdl-layout'],
        // https: true,
        server: ['.tmp', 'test'],
        port: 5002
      });

      // Watch built JS since browserify handles the watching
      gulp.watch('.tmp/scripts/**/*.js', reload);
    })
})

gulp.task('scripts', () => bundle(appWatcher));
gulp.task('scripts-onetime', function() {
  // Force gulp to exit
  return bundle().pipe($.exit())
})

const appWatcher = watchify(browserify(WATCHIFY_OPTS));
appWatcher.on('update', () => bundle(appWatcher));

function bundle(browserifyInstance) {
  return browserifyInstance.bundle()
    .on('error', function(err) {
      console.log(err.message);
      browserSync.notify(err.message, 2000);
      this.emit('end');
    })
    .pipe($.plumber())

    // convert Node stream of the bundled js to a single Vinyl file
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe($.sourcemaps.init({ loadMaps: true }))
    .pipe($.if(BUILD.PRODUCTION, $.uglify()))
    .pipe($.sourcemaps.write('./'))
    .pipe($.size({showFiles: true, title: 'scripts'}))
    .pipe(gulp.dest('dist/scripts'))
    .pipe(gulp.dest('.tmp/scripts'));
}

gulp.task('default', ['clean'], function(cb) {
  BUILD.PRODUCTION = true;

  runSequence(
    'styles',
    ['html', 'scripts', 'images', 'icon', 'vendor', 'copy'],
    cb
  )
});

