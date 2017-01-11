/**
 * @namespace biigle.transects
 * @ngdoc directive
 * @name transectFigure
 * @memberOf biigle.transects
 * @description A transect image
 */
angular.module('biigle.transects').directive('transectFigure', function () {
        "use strict";

        return {
            restrict: 'A',

            controller: function ($scope, labels, filter, msg, $timeout, images, IMAGES_UUIDS) {
                var saved = false;
                var saving = false;
                var error = false;

                var labelPopoverOpen = false;

                var handleAttachSuccess = function () {
                    saved = true;
                    saving = false;
                    error = false;

                    // success border should disappear after a few seconds
                    $timeout(function () {
                        saved = false;
                    }, 3000);
                };

                var handleAttachError = function (response) {
                    saved = false;
                    saving = false;
                    error = true;
                    msg.responseError(response);
                };

                $scope.uuid = IMAGES_UUIDS[$scope.id];

                $scope.hasFlag = function () {
                    return filter.hasFlag($scope.id);
                };

                $scope.handleClick = function (e) {
                    if ($scope.isInLabelMode()) {
                        e.preventDefault();
                        saving = true;
                        labels.attachToImage($scope.id)
                            .then(handleAttachSuccess, handleAttachError);
                    }
                };

                $scope.getClass = function () {
                    return {
                        'image-label-saved': saved,
                        'image-label-saving': saving,
                        'image-label-error': error
                    };
                };

                $scope.getImageLabels = function () {
                    return labels.getAttachedLabels($scope.id);
                };

                $scope.imageLabelsResolved = function () {
                    return labels.getAttachedLabels($scope.id).$resolved;
                };

                $scope.hasImageLabels = function () {
                    return labels.getAttachedLabels($scope.id).length > 0;
                };

                $scope.canDetachLabel = labels.canDetachLabel;

                $scope.detachLabel = function (label) {
                    labels.detachLabel($scope.id, label)
                        .then(angular.noop, msg.responseError);
                };

                $scope.toggleLabelPopover = function () {
                    labelPopoverOpen = !labelPopoverOpen;
                };

                $scope.isPopoverOpen = function () {
                    return labelPopoverOpen;
                };

                $scope.getPopoverPlacement = function () {
                    if (images.isImageInRightHalf($scope.id)) {
                        return 'left';
                    }

                    return 'right';
                };

                $scope.$on('label-mode.toggle', function () {
                    saving = false;
                    error = false;
                });
            }
        };
    }
);
