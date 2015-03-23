/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectDeleteController
 * @memberOf dias.projects
 * @description Initiates the deletion confirmation modal
 * @example

 */
angular.module('dias.projects').controller('ProjectDeleteController', function ($scope, $modal, $attrs, $timeout, msg) {
		"use strict";

		var success = function () {
			msg.success($attrs.successMsg);
			$timeout(function () {
				window.location.href = $attrs.successRedirectUrl;
			}, 2000);
		};

		var error = function () {
			msg.danger($attrs.errorMsg);
		};

		$scope.submit = function () {
			var modalInstance = $modal.open({
				templateUrl: 'confirmDeleteModal.html',
				size: 'sm',
				controller: 'ProjectDeleteModalController',
				scope: $scope
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
