/**
 * @namespace biigle.annotations
 * @ngdoc controller
 * @name SelectedLabelController
 * @memberOf biigle.annotations
 * @description Controller for the selected label display in the map
 */
angular.module('biigle.annotations').controller('SelectedLabelController', function ($scope, labels) {
      "use strict";

        $scope.getSelectedLabel = labels.getSelected;

        $scope.hasSelectedLabel = labels.hasSelected;
   }
);
