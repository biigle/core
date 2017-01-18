/**
 * @namespace biigle.largo
 * @ngdoc directive
 * @name largoFigure
 * @memberOf biigle.largo
 * @description An Largo annotation patch image
 */
angular.module('biigle.largo').directive('largoFigure', function () {
        "use strict";

        return {
            restrict: 'A',

            controller: function ($scope, annotations, msg) {

                var dismissed = false;

                $scope.changedLabel = null;

                var updateChangedLabel = function () {
                    $scope.changedLabel = annotations.getChangedLabel($scope.id);
                };

                var isDismissed = function () {
                    return annotations.isDismissed($scope.id);
                };

                var isChanged = function () {
                    return $scope.changedLabel !== null;
                };

                $scope.isChanged = isChanged;

                $scope.handleClick = function (e) {
                    annotations.selectAnnotation($scope.id);
                    updateChangedLabel();
                };

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

                updateChangedLabel();
            }
        };
    }
);
