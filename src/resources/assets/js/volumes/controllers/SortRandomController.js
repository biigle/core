/**
 * @namespace biigle.volumes
 * @ngdoc controller
 * @name SortRandomController
 * @memberOf biigle.volumes
 * @description Controller for sorting images randomly on the volumes overview page
 */
angular.module('biigle.volumes').controller('SortRandomController', function ($scope, sort, VOLUME_IMAGES) {
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

            $scope.activateSorter(id, shuffle(VOLUME_IMAGES.slice(0)));
        };
    }
);
