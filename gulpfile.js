"use strict"

var gulp = require('gulp');
var h = require('gulp-helpers');
var publish = h.publish('Biigle\\Modules\\Transects\\TransectsServiceProvider', 'public');

h.paths.sass = 'src/resources/assets/sass/';
h.paths.js = 'src/resources/assets/js/';
h.paths.public = 'src/public/assets/';

gulp.task('sass-main', function () {
    h.sass('main.scss', 'main.css');
});

gulp.task('sass-edit', function () {
    h.sass('edit.scss', 'edit.css');
});

gulp.task('sass-dashboard', function () {
    h.sass('dashboard.scss', 'dashboard.css');
});

gulp.task('sass', ['sass-main', 'sass-edit', 'sass-dashboard']);

gulp.task('js-main', function (cb) {
    h.angular('transects/**/*.js', 'main.js', cb);
});

gulp.task('js-edit', function (cb) {
    h.angular('edit/**/*.js', 'edit.js', cb);
});

gulp.task('js-vue', function (cb) {
    h.angular('vue/**/*.js', 'vue.js', cb);
});

gulp.task('js', ['js-main', 'js-edit', 'js-vue']);

gulp.task('watch', function () {
    gulp.watch(h.paths.sass + '**/*.scss', ['sass']);
    gulp.watch(h.paths.js + 'transects/**/*.js', ['js-main']);
    gulp.watch(h.paths.js + 'edit/**/*.js', ['js-edit']);
    gulp.watch(h.paths.js + 'vue/**/*.js', ['js-vue']);
    gulp.watch(h.paths.public + '**/*', publish);
});

gulp.task('default', ['sass', 'js'], publish)
