/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name MousePositionController
 * @memberOf dias.annotations
 * @description Controller for the mouse position element
 */
angular.module('dias.annotations').controller('MousePositionController', function ($scope, settings, map, debounce) {
        "use strict";
        var imageSize = [0, 0];
        $scope.position = [0, 0];

        var updatePosition = function (e) {
            $scope.position[0] = Math.round(e.coordinate[0]);
            // y coordinate should start at the top, not at the bottom as is OL standard
            $scope.position[1] = Math.round(imageSize[1] - e.coordinate[1]);
        };

        var update = function (e) {
            // Only update mouse position after it hasn't changed for x ms.
            // We do this because there is a costly DOM update on each update.
            debounce(function () {
                updatePosition(e);
            }, 50, 'mouse-position');
        };

        $scope.shown = function () {
            return settings.getPermanentSettings('show_mouse_position');
        };

        $scope.$watch($scope.shown, function (shown) {
            if (shown) {
                map.on('pointermove', update);
            } else {
                map.un('pointermove', update);
            }
        });

        $scope.$on('image.shown', function (e, image) {
            imageSize[0] = image.width;
            imageSize[1] = image.height;
        });
    }
);
