/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name SortByFilenameController
 * @memberOf dias.transects
 * @description Controller for sorting images by ID on the transects overview page
 */
angular.module('dias.transects').controller('SortByFilenameController', function ($scope, sort, TransectImageOrderByFilename, TRANSECT_ID) {
        "use strict";

        var id = 'filename';

        // cache the sequence here so it is loaded only once
        var sequence;

        $scope.active = function () {
            return sort.isSorterActive('filename');
        };

        $scope.toggle = function () {
            if (!sequence) {
                sequence = TransectImageOrderByFilename.query({transect_id: TRANSECT_ID});
            }

            sequence.$promise.then(function () {
                $scope.activateSorter(id, sequence);
            });
        };
    }
);
