/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name SortByFilenameController
 * @memberOf dias.transects
 * @description Controller for sorting images by ID on the transects overview page
 */
angular.module('dias.transects').controller('SortByFilenameController', function ($scope, sort, TRANSECT_IMAGES) {
        "use strict";

        var id = 'filename';

        $scope.active = function () {
            return sort.isSorterActive('filename');
        };

        $scope.toggle = function () {
            if ($scope.active()) return;

            $scope.activateSorter(id, TRANSECT_IMAGES);
        };

        /* Example for a generic sort controller:

        var id = 'filename';

        var cacheKey = 'filename-sequence';

        $scope.active = function () {
            return sort.isSorterActive('filename');
        };

        $scope.toggle = function () {
            if ($scope.active()) return;

            if (!$scope.hasCache(cacheKey)) {
                $scope.setLoading(true);
                $scope.setCache(cacheKey, TransectImageOrderByFilename.query({transect_id: TRANSECT_ID}, function () {
                    $scope.setLoading(false);
                }));
            }

            $scope.getCache(cacheKey).$promise.then(function (s) {
                $scope.activateSorter(id, s);
            });
        };
        */
    }
);
