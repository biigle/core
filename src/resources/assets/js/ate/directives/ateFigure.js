/**
 * @namespace dias.ate
 * @ngdoc directive
 * @name ateFigure
 * @memberOf dias.ate
 * @description An ATE annotation patch image
 */
angular.module('dias.ate').directive('ateFigure', function () {
        "use strict";

        return {
            restrict: 'A',

            controller: function ($scope, annotationLabels, msg) {

                var dismissed = false;

                $scope.handleClick = function (e) {
                    annotationLabels.toggleDismiss($scope.id);
                };

                $scope.isDismissed = function () {
                    return annotationLabels.isDismissed($scope.id);
                };

                $scope.getClass = function () {
                    return {
                        'label-dismissed': $scope.isDismissed()
                    };
                };
            }
        };
    }
);
