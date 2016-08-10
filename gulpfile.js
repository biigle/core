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

gulp.task('sass-dashboard', function () {
    h.sass('dashboard.scss', 'dashboard.css');
});

gulp.task('sass', ['sass-main', 'sass-dashboard']);

gulp.task('js', function (cb) {
    h.angular('projects/**/*.js', 'main.js', cb);
});

gulp.task('watch', function () {
    gulp.watch(h.paths.sass + 'main.scss', ['sass-main']);
    gulp.watch(h.paths.sass + 'dashboard.scss', ['sass-dashboard']);
    gulp.watch(h.paths.js + 'projects/**/*.js', ['js']);
    gulp.watch(h.paths.public + '**/*', publish);
});

gulp.task('default', ['sass', 'js'], publish)
