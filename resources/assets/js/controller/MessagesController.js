/**
 * @namespace dias.messages
 * @ngdoc controller
 * @name MessagesController
 * @memberOf dias.messages
 * @description Handles the live display of user feedback messages vir JS
 * @example

 */
angular.module('dias.messages').controller('MessagesController', function ($scope) {
		"use strict";

		$scope.alerts = [];

		// make method accessible by other modules
		window.$diasPostMessage = function (message, type) {
			$scope.$apply(function() {
				$scope.alerts.push({
					message: message,
					type: type || 'info'
				});
			});
		};

		$scope.close = function (index) {
			$scope.alerts.splice(index, 1);
		};
	}
);
