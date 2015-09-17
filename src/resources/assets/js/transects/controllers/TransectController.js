/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name TransectController
 * @memberOf dias.transects
 * @description Global controller for the transects page
 */
angular.module('dias.transects').controller('TransectController', function ($scope) {
		"use strict";

        $scope.info = {
            // number of overall images
            numberOfImages: undefined,
            // number of currently shown images
            limit: 20
        };

        $scope.progress = function () {
            return {
                width: ($scope.info.numberOfImages ? Math.min($scope.info.limit / $scope.info.numberOfImages, 1) * 100 : 0) + '%'
            };
        };
	}
);
