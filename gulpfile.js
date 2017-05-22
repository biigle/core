"use strict"

var gulp = require('gulp');
var h = require('gulp-helpers');
var publish = h.publish('Biigle\\Modules\\Export\\ExportServiceProvider', 'public');

h.paths.sass = 'src/resources/assets/sass/';
h.paths.js = 'src/resources/assets/js/';
h.paths.public = 'src/public/assets/';

gulp.task('js-main', function (cb) {
    h.js('export/**/*.js', 'main.js', cb);
});

gulp.task('js-annotations', function (cb) {
    h.js('annotations/**/*.js', 'annotations.js', cb);
});

gulp.task('js', ['js-main', 'js-annotations']);

gulp.task('watch', function () {
    gulp.watch(h.paths.js + 'export/**/*.js', ['js-main']);
    gulp.watch(h.paths.js + 'annotations/**/*.js', ['js-annotations']);
    gulp.watch(h.paths.public + '**/*', publish);
});

gulp.task('default', ['js'], publish)
