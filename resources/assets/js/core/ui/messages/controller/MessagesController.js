/**
 * @namespace dias.ui.messages
 * @ngdoc controller
 * @name MessagesController
 * @memberOf dias.ui.messages
 * @description Handles the live display of user feedback messages via JS
 */
angular.module('dias.ui.messages').controller('MessagesController', function ($scope, MAX_MSG) {
		"use strict";

		$scope.alerts = [];

		// make method accessible by other modules
		window.$diasPostMessage = function (type, message) {
			$scope.$apply(function() {
				$scope.alerts.unshift({
					message: message,
					type: type || 'info'
				});

				if ($scope.alerts.length > MAX_MSG) {
					$scope.alerts.pop();
				}
			});
		};

		$scope.close = function (index) {
			$scope.alerts.splice(index, 1);
		};
	}
);
