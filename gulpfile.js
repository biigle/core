"use strict"

var gulp = require('gulp');
var h = require('gulp-helpers');
var publish = h.publish('Dias\\Modules\\Projects\\ProjectsServiceProvider');

h.paths.sass = 'src/resources/assets/sass/';
h.paths.js = 'src/resources/assets/js/';
h.paths.public = 'src/public/assets/';

gulp.task('sass-main', function () {
    h.sass('main.scss', 'main.css');
});

gulp.task('sass', ['sass-main']);

gulp.task('js-projects', function (cb) {
    h.angular('projects/**/*.js', 'main.js', cb);
});

gulp.task('js-transects', function (cb) {
    h.angular('transects/**/*.js', 'transects.js', cb);
});

gulp.task('js-vue', function (cb) {
    h.angular('vue/**/*.js', 'vue.js', cb);
});

gulp.task('js', ['js-projects', 'js-transects', 'js-vue']);

gulp.task('watch', function () {
    gulp.watch(h.paths.sass + '**/*.scss', ['sass-main']);
    gulp.watch(h.paths.js + 'projects/**/*.js', ['js-projects']);
    gulp.watch(h.paths.js + 'transects/**/*.js', ['js-transects']);
    gulp.watch(h.paths.js + 'vue/**/*.js', ['js-vue']);
    gulp.watch(h.paths.public + '**/*', publish);
});

gulp.task('default', ['sass', 'js'], publish)
