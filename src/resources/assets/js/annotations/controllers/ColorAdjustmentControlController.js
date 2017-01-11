/**
 * @namespace biigle.annotations
 * @ngdoc controller
 * @name ColorAdjustmentControlController
 * @memberOf biigle.annotations
 * @description Controller for the sidebar color adjustment foldout button
 */
angular.module('biigle.annotations').controller('ColorAdjustmentControlController', function ($scope, mapImage) {
        "use strict";

        $scope.supportsColorAdjustment = mapImage.supportsColorAdjustment;
    }
);
