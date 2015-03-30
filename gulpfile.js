"use strict"
process.env.DISABLE_NOTIFIER = true;

var gulp    = require('gulp');
var elixir  = require('laravel-elixir');
var angular = require('laravel-elixir-angular');

elixir(function (mix) {
	process.chdir('src');
	mix.sass('main.scss', 'public/assets/styles')
	   .angular('resources/assets/js/', 'public/assets/scripts', 'main.js');
});