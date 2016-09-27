"use strict"

var gulp = require('gulp');
var h = require('gulp-helpers');
var publish = h.publish('Dias\\Modules\\Export\\ExportServiceProvider', 'public');

h.paths.sass = 'src/resources/assets/sass/';
h.paths.js = 'src/resources/assets/js/';
h.paths.public = 'src/public/assets/';

gulp.task('sass', function () {
    // h.sass('main.scss', 'main.css');
});

gulp.task('js-main', function (cb) {
    h.angular('export/**/*.js', 'main.js', cb);
});

gulp.task('js-annotations', function (cb) {
    h.angular('annotations/**/*.js', 'annotations.js', cb);
});

gulp.task('js', ['js-main', 'js-annotations']);

gulp.task('watch', function () {
    gulp.watch(h.paths.sass + '**/*.scss', ['sass']);
    gulp.watch(h.paths.js + 'export/**/*.js', ['js-main']);
    gulp.watch(h.paths.js + 'annotations/**/*.js', ['js-annotations']);
    gulp.watch(h.paths.public + '**/*', publish);
});

gulp.task('default', ['sass', 'js'], publish)
