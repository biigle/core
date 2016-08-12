"use strict";

var gulp = require('gulp');
var h = require('gulp-helpers');
var publish = h.publish('Dias\\Modules\\Ate\\AteServiceProvider', 'public');

h.paths.sass = 'src/resources/assets/sass/';
h.paths.js = 'src/resources/assets/js/';
h.paths.public = 'src/public/assets/';

gulp.task('sass-main', function () {
   h.sass('main.scss', 'main.css');
});

gulp.task('sass-annotations', function () {
   h.sass('annotations.scss', 'annotations.css');
});

gulp.task('sass', ['sass-main', 'sass-annotations']);

gulp.task('js-main', function (cb) {
   h.angular('ate/**/*.js', 'main.js', cb);
});

gulp.task('js-project-ate', function (cb) {
   h.angular('project-ate/**/*.js', 'project-ate.js', cb);
});

gulp.task('js-annotations', function (cb) {
   h.angular('annotations/**/*.js', 'annotations.js', cb);
});

gulp.task('js', ['js-main', 'js-project-ate', 'js-annotations']);

gulp.task('watch', function () {
    gulp.watch(h.paths.sass + 'main.scss', ['sass-main']);
    gulp.watch(h.paths.sass + 'annotations.scss', ['sass-annotations']);
    gulp.watch(h.paths.js + 'ate/**/*.js', ['js-main']);
    gulp.watch(h.paths.js + 'project-ate/**/*.js', ['js-project-ate']);
    gulp.watch(h.paths.js + 'annotations/**/*.js', ['js-annotations']);
    gulp.watch(h.paths.public + '**/*', publish);
});

gulp.task('default', ['sass', 'js'], publish)
