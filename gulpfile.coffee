"use strict"

pack         = require './package.json'
gulp         = require 'gulp'
# del          = require 'del'
concat       = require 'gulp-concat'
notify       = require 'gulp-notify'
flatten      = require 'gulp-flatten'

coffee       = require 'gulp-coffee'
ngAnnotate   = require 'gulp-ng-annotate'
uglify       = require 'gulp-uglify'

sass         = require 'gulp-sass'
autoprefixer = require 'gulp-autoprefixer'
minifyCSS    = require 'gulp-minify-css'

paths =
	build:
		styles:     "public/assets/styles/"
		scripts:    "public/assets/scripts/"
		templates:  "public/assets/templates/"
	source:
		styles:      "client/styles/"
		scripts:     "client/scripts/"
		templates:   "client/templates/"
		tests:       "client/tests/"

handleError = (error) ->
	notify.onError(
		title: "<%= error.plugin %> <%= error.name %>"
		message: "<%= error.message %>"
	)(error)
	console.log "Stack:\n #{error.stack}"
	@emit "end"

gulp.task "source.styles", ->
	gulp.src "#{paths.source.styles}main.scss"
		.pipe sass().on "error", handleError
		.pipe autoprefixer()
		.pipe concat "#{pack.name}.css"
		.pipe gulp.dest paths.build.styles
		.pipe concat "#{pack.name}.min.css"
		.pipe minifyCSS()
		.pipe gulp.dest paths.build.styles

gulp.task "source.scripts", ->	
	gulp.src "#{paths.source.scripts}**/*.coffee"
		.pipe concat "#{pack.name}.js"
		.pipe coffee().on "error", handleError
		.pipe ngAnnotate()
		.pipe gulp.dest paths.build.scripts
		.pipe concat "#{pack.name}.min.js"
		.pipe uglify()
		.pipe gulp.dest paths.build.scripts

gulp.task "source.templates", ->
	gulp.src "#{paths.source.templates}**/*.html"
		.pipe flatten()
		.pipe gulp.dest "#{paths.build.templates}"

gulp.task "watch", ->
	gulp.watch "#{paths.source.styles}**/*.scss", ["source.styles"]
	gulp.watch "#{paths.source.scripts}**/*.coffee", ["source.scripts"]
	gulp.watch "#{paths.source.templates}**/*.html", ["source.templates"]

gulp.task "build", [
	"source.styles"
	"source.scripts"
	"source.templates"
]

gulp.task "default", [
	"watch"
	"build"
]
