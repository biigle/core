"use strict"
process.env.DISABLE_NOTIFIER = true;

var gulp    = require('gulp');
var elixir  = require('laravel-elixir');
var angular = require('laravel-elixir-angular');
var shell   = require('gulp-shell');

elixir(function (mix) {
	process.chdir('src');
	mix.sass('main.scss', 'public/assets/styles/main.css')
	   .angular('resources/assets/js/annotations/', 'public/assets/scripts', 'main.js');
    mix.sass('transects.scss', 'public/assets/styles/transects.css');
    mix.task('publish', 'resources/assets/**/*');
});

gulp.task('publish', function () {
    gulp.src('').pipe(shell('php ../../../../artisan vendor:publish --provider="Dias\\Modules\\Annotations\\AnnotationsServiceProvider" --force'));
});
