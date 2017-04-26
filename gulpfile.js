"use strict"

var gulp = require('gulp');
var h = require('gulp-helpers');
var publish = h.publish('Biigle\\Modules\\Volumes\\VolumesServiceProvider', 'public');

h.paths.sass = 'src/resources/assets/sass/';
h.paths.js = 'src/resources/assets/js/';
h.paths.public = 'src/public/assets/';

gulp.task('sass-main', function () {
    h.sass('main.scss', 'main.css');
});

gulp.task('sass-dashboard', function () {
    h.sass('dashboard.scss', 'dashboard.css');
});

gulp.task('sass', ['sass-main', 'sass-dashboard']);

gulp.task('js-main', function (cb) {
    h.angular('**/*.js', 'main.js', cb);
});

gulp.task('js', ['js-main']);

gulp.task('watch', function () {
    gulp.watch(h.paths.sass + '**/*.scss', ['sass']);
    gulp.watch(h.paths.js + '**/*.js', ['js-main']);
    gulp.watch(h.paths.public + '**/*', publish);
});

gulp.task('default', ['sass', 'js'], publish)
