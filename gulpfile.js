"use strict"

var gulp = require('gulp');
var h = require('gulp-helpers');
var apidoc = require('gulp-apidoc');

gulp.task('sass', function () {
   h.sass('main.scss', 'main.css');
});

gulp.task('js', function (cb) {
   h.js('**/*.js', 'main.js', cb);
});

gulp.task('apidoc', function (cb) {
    apidoc.exec({
        src: 'app/Http/Controllers/Api/',
        dest: 'public/doc/api'
    }, cb);
});

gulp.task('watch', function () {
    gulp.watch(h.paths.sass + '**/*.scss', ['sass']);
    gulp.watch(h.paths.js + '**/*.js', ['js']);
});

gulp.task('default', ['sass', 'js'])
