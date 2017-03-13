var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var changed = require('gulp-changed');

var paths = {
  scripts: [
    'lib/ionic/js/ionic.bundle.js',
    'lib/angular-i18n/angular-locale_es-ar.js',
    'lib/ng-lodash/build/ng-lodash.min.js',
    'lib/pdfmake/build/pdfmake.min.js',
    'lib/pdfmake/build/vfs_fonts.js',
    'client/www/js/*.js'
  ],
  images: 'client/www/img/*',
  serverFiles: [
    'controllers/*',
    'scratch/*',
    'models/*',
    'server.js',
    'routes.js',
    'package.json',
    'serviceAccountKey.json',
    'Procfile',
    '.gitignore'
  ],
  heroku: "./comprasserver"
};

gulp.task('scripts', ['clean'], function() {
  // Minify and copy all JavaScript (except vendor scripts)
  // with sourcemaps all the way down
  return gulp.src(paths.scripts)
    .pipe(sourcemaps.init())
      .pipe(uglify())
      .pipe(concat('all.min.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('build/js'));
});

// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch(paths.scripts, ['scripts']);
  gulp.watch(paths.images, ['images']);
});

//This task moves the SERVER edited files to the Heroku REPO folder.
gulp.task('copy-to-heroku', function() {
    gulp.src(paths.serverFiles, {base:"."})
        .pipe(changed(paths.heroku))
        .pipe(gulp.dest(paths.heroku))
});

gulp.task('watch-server', function() {
  for (var index in paths.serverFiles) {
    gulp.watch(paths.serverFiles[index], ['copy-to-heroku']);
  }
});

gulp.task('clean', function() {
  // You can use multiple globbing patterns as you would with `gulp.src`
  return del(['client/build']);
});

gulp.task('scripts', ['clean'], function() {
  return gulp.src(paths.scripts)
      .pipe(uglify())
      .pipe(concat('all.min.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('client/build/js'));
});



// The default task (called when you run `gulp` from cli)
gulp.task('default', ['watch', 'scripts', 'images']);