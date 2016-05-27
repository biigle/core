/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name SortRandomController
 * @memberOf dias.transects
 * @description Controller for sorting images randomly on the transects overview page
 */
angular.module('dias.transects').controller('SortRandomController', function ($scope, sort, TRANSECT_IMAGES) {
        "use strict";

        var id = 'random';

        // Durstenfeld shuffle
        // see: http://stackoverflow.com/a/12646864/1796523
        var shuffle = function (array) {
            var i, j, temp;
            for (i = array.length - 1; i > 0; i--) {
                j = Math.floor(Math.random() * (i + 1));
                temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            return array;
        };

        $scope.active = function () {
            return sort.isSorterActive('random');
        };

        $scope.toggle = function () {
            if ($scope.active()) return;

            $scope.activateSorter(id, shuffle(TRANSECT_IMAGES.slice(0)));
        };
    }
);
