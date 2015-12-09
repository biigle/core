/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name FilterController
 * @memberOf dias.transects
 * @description Controller for the filter feature of the transects page
 */
angular.module('dias.transects').controller('FilterController', function ($scope, images, TRANSECT_IMAGES) {
		"use strict";

        $scope.totalNoImages = TRANSECT_IMAGES.length;

        var update = function () {
            $scope.currentNoImages = images.length;
        };

        $scope.$on('transects.images.new-filtering', update);
        update();
	}
);
