"use strict";

var gulp = require('gulp');
var h = require('gulp-helpers');
var publish = h.publish('Biigle\\Modules\\Largo\\LargoServiceProvider', 'public');

h.paths.sass = 'src/resources/assets/sass/';
h.paths.js = 'src/resources/assets/js/';
h.paths.public = 'src/public/assets/';

gulp.task('sass-main', function () {
   h.sass('main.scss', 'main.css');
});

gulp.task('sass', ['sass-main']);

gulp.task('js-main', function (cb) {
   h.js('**/*.js', 'main.js', cb);
});

gulp.task('js', ['js-main']);

gulp.task('watch', function () {
    gulp.watch(h.paths.sass + '**/*.scss', ['sass-main']);
    gulp.watch(h.paths.js + '**/*.js', ['js-main']);
    gulp.watch(h.paths.public + '**/*', publish);
});

gulp.task('default', ['sass', 'js'], publish)
