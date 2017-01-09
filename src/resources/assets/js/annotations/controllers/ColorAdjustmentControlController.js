/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name ColorAdjustmentControlController
 * @memberOf dias.annotations
 * @description Controller for the sidebar color adjustment foldout button
 */
angular.module('dias.annotations').controller('ColorAdjustmentControlController', function ($scope, mapImage) {
        "use strict";

        $scope.supportsColorAdjustment = mapImage.supportsColorAdjustment;
    }
);
