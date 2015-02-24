/**
 * @namespace dias.core
 * @description The DIAS core AngularJS module.
 */
angular.module('dias.core', ['ngResource']);

angular.module('dias.core').config(function ($httpProvider) {
	"use strict";

	$httpProvider.defaults.headers.common["X-Requested-With"] =
		"XMLHttpRequest";
});
