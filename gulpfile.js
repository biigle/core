"use strict"
process.env.DISABLE_NOTIFIER = true;

var gulp    = require('gulp');
var elixir  = require('laravel-elixir');
var angular = require('laravel-elixir-angular')

/*
 |--------------------------------------------------------------------------
 | Elixir Asset Management
 |--------------------------------------------------------------------------
 |
 | Elixir provides a clean, fluent API for defining some basic Gulp tasks
 | for your Laravel application. By default, we are compiling the Sass
 | file for our application, as well as publishing vendor resources.
 |
 */

elixir(function (mix) {
	mix.sass('main.scss', 'public/assets/styles/main.css')
	   .angular('resources/assets/js/core/', 'public/assets/scripts', 'main.js');
});

var shell = require('gulp-shell');
gulp.task('docs', shell.task([
	'node_modules/jsdoc/jsdoc.js '+
	'-c node_modules/angular-jsdoc/conf.json '+   // config file
	'-t node_modules/angular-jsdoc/template '+    // template file
	'-d public/doc/client '+                      // output directory
	'-r resources/assets/js'                      // source code directory
]));

var apidoc = require('gulp-apidoc');
gulp.task('apidoc', function (cb) {
	apidoc.exec({
		src: 'app/Http/Controllers/Api/',
		dest: 'public/doc/api'
	}, cb);
});

