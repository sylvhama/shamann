/*jslint node: true */
"use strict";

var $           = require('gulp-load-plugins')();
var argv        = require('yargs').argv;
var gulp        = require('gulp');
var browserSync = require('browser-sync').create();
var merge       = require('merge-stream');
var sequence    = require('run-sequence');
var colors      = require('colors');
var dateFormat  = require('dateformat');
var del         = require('del');
var cleanCSS    = require('gulp-clean-css');
var uncss       = require('gulp-uncss');
var htmlmin     = require('gulp-htmlmin');

// Enter URL of your local server here
// Example: 'http://localwebsite.dev'
var URL = 'http://test.localhost/shamann';

// Check for --production flag
var isProduction = !!(argv.production);

// Browsers to target when prefixing CSS.
var COMPATIBILITY = [
  'ie >= 9',
  'Android >= 2.3'
];

// File paths to various assets are defined here.
var PATHS = {
  sass: [
    'assets/components/foundation-sites/scss',
  ],
  javascript: [
    'assets/components/jquery/dist/jquery.min.js',
    'assets/components/what-input/what-input.js',
    'assets/components/foundation-sites/js/foundation.core.js',
    'assets/components/foundation-sites/js/foundation.util.*.js',

    // Paths to individual JS components defined below
    //'assets/components/foundation-sites/js/foundation.abide.js',
    //'assets/components/foundation-sites/js/foundation.accordion.js',
    //'assets/components/foundation-sites/js/foundation.accordionMenu.js',
    //'assets/components/foundation-sites/js/foundation.drilldown.js',
    //'assets/components/foundation-sites/js/foundation.dropdown.js',
    //'assets/components/foundation-sites/js/foundation.dropdownMenu.js',
    //'assets/components/foundation-sites/js/foundation.equalizer.js',
    //'assets/components/foundation-sites/js/foundation.interchange.js',
    //'assets/components/foundation-sites/js/foundation.magellan.js',
    //'assets/components/foundation-sites/js/foundation.offcanvas.js',
    //'assets/components/foundation-sites/js/foundation.orbit.js',
    //'assets/components/foundation-sites/js/foundation.responsiveMenu.js',
    //'assets/components/foundation-sites/js/foundation.responsiveToggle.js',
    //'assets/components/foundation-sites/js/foundation.reveal.js',
    //'assets/components/foundation-sites/js/foundation.slider.js',
    //'assets/components/foundation-sites/js/foundation.sticky.js',
    //'assets/components/foundation-sites/js/foundation.tabs.js',
    //'assets/components/foundation-sites/js/foundation.toggler.js',
    //'assets/components/foundation-sites/js/foundation.tooltip.js',
    // Motion UI
    //'assets/components/motion-ui/motion-ui.js',
    // Include your own custom scripts (located in the custom folder)
    'assets/javascript/custom/*.js'
  ]
};

// Browsersync task
gulp.task('browser-sync', ['build'], function() {

  var files = [
            '**/*.php',
            '**/*.html',
            '**/*.json',
            '**/*.{png,jpg,gif}',
          ];

  browserSync.init(files, {
    // Proxy address
    proxy: URL,

    // Port #
    // port: PORT
  });
});

// Compile Sass into CSS
// In production, the CSS is compressed
gulp.task('sass', function() {
  return gulp.src('assets/scss/shamann.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      includePaths: PATHS.sass
    }))
    .on('error', $.notify.onError({
        message: "<%= error.message %>",
        title: "Sass Error"
    }))
    .pipe($.autoprefixer({
      browsers: COMPATIBILITY
    }))
    .pipe($.if(isProduction, cleanCSS()))
    .pipe($.if(!isProduction, $.sourcemaps.write('.')))
    .pipe(gulp.dest('assets/stylesheets'))
    .pipe(browserSync.stream({match: '**/*.css'}));
});

// Uncss
gulp.task('uncss', function () {
    return gulp.src('assets/stylesheets/shamann.css')
        .pipe(uncss({
            html: ['index.html']
        }))
        .pipe(gulp.dest('./assets/stylesheets/uncss/'));
});

// Minify HTML
gulp.task('minify-html', function() {
  return gulp.src('index.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist'));
});

// Lint all JS files in custom directory
gulp.task('lint', function() {
  return gulp.src('assets/javascript/custom/*.js')
    .pipe($.jshint())
    .pipe($.notify(function (file) {
      if (file.jshint.success) {
        return false;
      }

      var errors = file.jshint.results.map(function (data) {
        if (data.error) {
          return "(" + data.error.line + ':' + data.error.character + ') ' + data.error.reason;
        }
      }).join("\n");
      return file.relative + " (" + file.jshint.results.length + " errors)\n" + errors;
    }));
});

// Combine JavaScript into one file
// In production, the file is minified
gulp.task('javascript', function() {
  var uglify = $.uglify()
    .on('error', $.notify.onError({
      message: "<%= error.message %>",
      title: "Uglify JS Error"
    }));

  return gulp.src(PATHS.javascript)
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe($.concat('shamann.js', {
      newLine:'\n;'
    }))
    .pipe($.if(isProduction, uglify))
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('assets/javascript'))
    .pipe(browserSync.stream());
});

// Build task
// Runs copy then runs sass & javascript in parallel
gulp.task('build', ['clean'], function(done) {
  sequence(
          ['sass', 'javascript', 'lint'],
          done);
});

// Clean task
gulp.task('clean', function(done) {
  sequence(['clean:javascript', 'clean:css'],
            done);
});

// Clean JS
gulp.task('clean:javascript', function() {
  return del([
      'assets/javascript/shamann.js'
  ]);
});

// Clean CSS
gulp.task('clean:css', function() {
  return del([
      'assets/stylesheets/shamann.css',
      'assets/stylesheets/shamann.css.map'
    ]);
});

// Default gulp task
// Run build task and watch for file changes
gulp.task('default', ['build', 'browser-sync'], function() {
  // Log file changes to console
  function logFileChange(event) {
    var fileName = require('path').relative(__dirname, event.path);
    console.log('[' + 'WATCH'.green + '] ' + fileName.magenta + ' was ' + event.type + ', running tasks...');
  }

  // Sass Watch
  gulp.watch(['assets/scss/**/*.scss'], ['clean:css', 'sass'])
    .on('change', function(event) {
      logFileChange(event);
    });

  // JS Watch
  gulp.watch(['assets/javascript/custom/**/*.js'], ['clean:javascript', 'javascript', 'lint'])
    .on('change', function(event) {
      logFileChange(event);
    });
});
