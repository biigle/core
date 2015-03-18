/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectDeleteController
 * @memberOf dias.projects
 * @description Initiates the deletion confirmation modal
 * @example

 */
angular.module('dias.projects').controller('ProjectDeleteController', function ($scope, $modal, $attrs, $timeout) {
		"use strict";

		var success = function () {
			window.$diasPostMessage($attrs.successMsg, 'success');
			$timeout(function () {
				window.location.href = $attrs.successRedirectUrl;
			}, 2000);
		};

		var error = function () {
			window.$diasPostMessage($attrs.errorMsg, 'danger');
		};

		$scope.submit = function () {
			var modalInstance = $modal.open({
				templateUrl: 'confirmDeleteModal.html',
				size: 'sm',
				controller: 'ProjectDeleteModalController'
			});

			modalInstance.result.then(function (result) {
				switch (result) {
					case 'success':
						success();
						break;
					case 'error':
						error();
						break;
				}
			});
		};
	}
);
