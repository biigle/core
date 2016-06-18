/**
 * @namespace dias.transects
 * @ngdoc directive
 * @name transectFigure
 * @memberOf dias.transects
 * @description A transect image
 */
angular.module('dias.transects').directive('transectFigure', function () {
        "use strict";

        return {
            restrict: 'C',

            controller: function ($scope, labels, filter, msg, $timeout) {
                var saved = false;
                var saving = false;
                var error = false;

                var handleSuccess = function () {
                    saved = true;
                    saving = false;
                    error = false;

                    // success border should disappear after a few seconds
                    $timeout(function () {
                        saved = false;
                    }, 3000);
                };

                var handleError = function (response) {
                    saved = false;
                    saving = false;
                    error = true;
                    msg.responseError(response);
                };

                $scope.hasFlag = function () {
                    return filter.hasFlag($scope.id);
                };

                $scope.handleClick = function (e) {
                    if (!$scope.isInLabelMode()) return;
                    e.preventDefault();
                    saving = true;
                    labels.attachToImage($scope.id).then(handleSuccess, handleError);
                };

                $scope.getClass = function () {
                    return {
                        'image-label-saved': saved,
                        'image-label-saving': saving,
                        'image-label-error': error
                    };
                };

                $scope.$on('label-mode.toggle', function () {
                    saving = false;
                    error = false;
                });
            }
        };
    }
);
