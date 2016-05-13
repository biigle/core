/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name TransectController
 * @memberOf dias.transects
 * @description Global controller for the transects page
 */
angular.module('dias.transects').controller('TransectController', function ($scope, images) {
		"use strict";

        $scope.progress = function () {
            return {width:  images.progress() * 100 + '%'};
        };
	}
);
