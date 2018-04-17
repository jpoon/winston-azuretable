var gulp = require('gulp'),
    eslint = require('gulp-eslint'),
    mocha = require('gulp-mocha');

var appFiles = 'lib/**/*.js',
    testFiles = 'test/**/*.test.js';

gulp.task('lint', function() {
  return gulp.src([appFiles, testFiles])
          .pipe(eslint())
          .pipe(eslint.format())
          .pipe(eslint.failAfterError());
});

gulp.task('test', ['lint'], function() {
  return gulp.src(testFiles)
         .pipe(mocha());
});

gulp.task('default', ['test']);
