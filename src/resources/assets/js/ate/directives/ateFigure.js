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

            controller: function ($scope, annotations, msg) {

                var dismissed = false;

                $scope.changedLabel = null;

                $scope.handleClick = function (e) {
                    annotations.selectAnnotation($scope.id);
                    $scope.changedLabel = annotations.getChangedLabel($scope.id);
                };

                var isDismissed = function () {
                    return annotations.isDismissed($scope.id);
                };

                var isChanged = function () {
                    return $scope.changedLabel !== null;
                };

                $scope.isChanged = isChanged;

                $scope.getTitle = function () {
                    if ($scope.isInDismissMode()) {
                        if (isDismissed()) {
                            return 'Undo dismissing this annotation';
                        }

                        return 'Dismiss this annotation';
                    }

                    if (isChanged()) {
                        return 'Revert changing the label of this annotation';
                    }

                    return 'Change the label of this annotation';
                };

                $scope.getClass = function () {
                    return {
                        'annotation-selected': $scope.isInDismissMode() && isDismissed() || $scope.isInReLabellingMode() && isChanged()
                    };
                };
            }
        };
    }
);
