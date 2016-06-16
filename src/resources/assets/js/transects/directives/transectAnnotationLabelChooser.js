/**
 * @namespace dias.ui.users
 * @ngdoc directive
 * @name transectAnnotationLabelChooser
 * @memberOf dias.transects
 * @description An input field to find a label that was used in a transect
 * @example
// HTML
<input placeholder="Search by label name" data-transect-label-chooser="addLabel" data-transect-id="1" />

// Controller
$scope.addLabel = function (label) {
    // do something
};

 */
angular.module('dias.transects').directive('transectAnnotationLabelChooser', function () {
      "use strict";

      return {
         restrict: 'A',

         scope: {
            select: '=transectAnnotationLabelChooser',
            id: '=transectId'
         },

         replace: true,

         template: '<input type="text" data-ng-model="selected" data-uib-typeahead="label.name for label in find($viewValue)" data-typeahead-wait-ms="250" data-typeahead-on-select="select($item)"/>',

         controller: function ($scope, TransectAnnotationLabels) {
            $scope.find = function (query) {
               return TransectAnnotationLabels.find({
                    transect_id: $scope.id,
                    query: encodeURIComponent(query)
                }).$promise;
            };
         }
      };
   }
);
