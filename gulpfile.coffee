"use strict"

pack         = require './package.json'
gulp         = require 'gulp'
elixir       = require 'laravel-elixir'

paths =
	build:
		styles:     "public/assets/styles"
		scripts:    "public/assets/scripts"
		templates:  "public/assets/templates"

elixir (mix) ->
	mix.sass 'main.scss', "#{paths.build.styles}"