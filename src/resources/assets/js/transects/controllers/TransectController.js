/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name TransectController
 * @memberOf dias.transects
 * @description Global controller for the transects page
 */
angular.module('dias.transects').controller('TransectController', function ($scope, $attrs, TransectImage) {
		"use strict";

        // number of initially shown images
        var initialLimit = 20;

        $scope.transectId = $attrs.transectId;

        $scope.images = {
            // all image IDs of the transect in arbirtary ordering
            ids: [],
            // the currently displayed ordering of images (as array of image IDs)
            sequence: [],
            // number of currently shown images
            limit: initialLimit,
            // number of overall images
            length: undefined
        };

        $scope.progress = function () {
            return {
                width: ($scope.images.length ? Math.min($scope.images.limit / $scope.images.length, 1) * 100 : 0) + '%'
            };
        };

        $scope.setImagesSequence = function (sequence) {
            // if sequence is null, reset
            $scope.images.sequence = sequence || $scope.images.ids;
            $scope.$broadcast('transects.images.new-sequence');
        };

        // array of all image ids of this transect
        $scope.images.ids = TransectImage.query({transect_id: $scope.transectId}, function (ids) {
            $scope.images.length = ids.length;
            $scope.images.sequence = ids;
        });
	}
);
