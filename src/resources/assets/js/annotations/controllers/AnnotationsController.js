/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name AnnotationsController
 * @memberOf dias.annotations
 * @description Controller for the annotations list in the sidebar
 */
angular.module('dias.annotations').controller('AnnotationsController', function ($scope, annotations) {
        "use strict";

        $scope.getAnnotations = annotations.getGroupedByLabel;
    }
);
