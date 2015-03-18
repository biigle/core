/**
 * @namespace dias.messages
 * @ngdoc controller
 * @name MessagesController
 * @memberOf dias.messages
 * @description Handles the live display of user feedback messages vir JS
 * @example

 */
angular.module('dias.messages').controller('MessagesController', function ($scope, $sce) {
		"use strict";

		var maxMessages = 2;
		$scope.alerts = [];

		// make method accessible by other modules
		window.$diasPostMessage = function (message, type) {
			$scope.$apply(function() {
				$scope.alerts.unshift({
					message: $sce.trustAsHtml(message),
					type: type || 'info'
				});

				if ($scope.alerts.length > maxMessages) {
					$scope.alerts.pop();
				}
			});
		};

		$scope.close = function (index) {
			$scope.alerts.splice(index, 1);
		};
	}
);
