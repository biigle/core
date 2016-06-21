"use strict"
process.env.DISABLE_NOTIFIER = true;

var gulp    = require('gulp');
var elixir  = require('laravel-elixir');
var angular = require('laravel-elixir-angular');
var shell   = require('gulp-shell');

elixir(function (mix) {
	process.chdir('src');
	mix.sass('main.scss', 'public/assets/styles')
	   .angular('resources/assets/js/projects/', 'public/assets/scripts', 'main.js');
    mix.task('publish', 'resources/assets/**/*');

    mix.sass('dashboard.scss', 'public/assets/styles/dashboard.css')
});

gulp.task('publish', function () {
    gulp.src('').pipe(shell('php ../../../../artisan vendor:publish --provider="Dias\\Modules\\Projects\\ProjectsServiceProvider" --force'));
});
