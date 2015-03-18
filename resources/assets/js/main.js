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

/**
 * @namespace dias.messages
 * @description The DIAS user feedback messages AngularJS module.
 */
angular.module('dias.messages', ['ui.bootstrap']);

// bootstrap the messages module
angular.element(document).ready(function () {
	"use strict";

	angular.bootstrap(
		document.querySelector('[data-ng-controller="MessagesController"]'),
		['dias.messages']
	);
});