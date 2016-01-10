var gulp        = require('gulp'),
    useref      = require('gulp-useref'),
    gulpif      = require('gulp-if'),
    uglify      = require('gulp-uglify'),
    cssnano     = require('gulp-cssnano'),
    wiredep     = require('wiredep').stream,
    del         = require('del'),
    runSequence = require('run-sequence'),
    browserSync = require('browser-sync').create();

gulp.task('fonts', function(){
  return gulp.src('src/fonts/*')
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('minify', function () {
  return gulp.src('src/index.html')
    .pipe(wiredep())
    .pipe(useref())
    .pipe(gulpif('*.js', uglify()))
    .pipe(gulpif('*.css', cssnano()))
    .pipe(gulp.dest('dist'));
});

gulp.task('delete', function() {
  del('dist/*');
});

gulp.task('build', function(callback) {
  runSequence(
    'delete',
    'minify',
    'fonts',
    callback
  );
});

gulp.task('browser-sync', ['build'],function() {
    browserSync.init({
        server: {
            baseDir: "./dist/"
        }
    });
});

gulp.task('default', ['browser-sync']);
