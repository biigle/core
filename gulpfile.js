"use strict";
process.env.DISABLE_NOTIFIER = true;

var gulp    = require('gulp');
var elixir  = require('laravel-elixir');
var angular = require('laravel-elixir-angular');
var shell   = require('gulp-shell');

elixir(function (mix) {
    process.chdir('src');
    mix.sass('main.scss', 'public/assets/styles/main.css')
        .angular('resources/assets/js/ate/', 'public/assets/scripts', 'main.js');

    mix.angular('resources/assets/js/project-ate/', 'public/assets/scripts', 'project-ate.js');

    mix.sass('annotations.scss', 'public/assets/styles/annotations.css')
        .angular('resources/assets/js/annotations/', 'public/assets/scripts', 'annotations.js');

    mix.task('publish', 'public/assets/**/*');
});

gulp.task('publish', function () {
    gulp.src('').pipe(shell('php ../../../../artisan vendor:publish --provider="Dias\\Modules\\Ate\\AteServiceProvider" --tag="public" --force'));
});
