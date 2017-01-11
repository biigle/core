"use strict"

var gulp = require('gulp');
var h = require('gulp-helpers');
var publish = h.publish('Biigle\\Modules\\Annotations\\AnnotationsServiceProvider');

h.paths.sass = 'src/resources/assets/sass/';
h.paths.js = 'src/resources/assets/js/';
h.paths.public = 'src/public/assets/';

gulp.task('sass', function () {
    h.sass('main.scss', 'main.css');
});

gulp.task('js-main', function (cb) {
    h.angular('annotations/**/*.js', 'main.js', cb);
});

gulp.task('js-transects', function (cb) {
    h.angular('transects/**/*.js', 'transects.js', cb);
});

gulp.task('js', ['js-main', 'js-transects']);

gulp.task('watch', function () {
    gulp.watch(h.paths.sass + '**/*.scss', ['sass']);
    gulp.watch(h.paths.js + 'annotations/**/*.js', ['js-main']);
    gulp.watch(h.paths.js + 'transects/**/*.js', ['js-transects']);
    gulp.watch(h.paths.public + '**/*', publish);
});

gulp.task('default', ['sass', 'js'], publish)
