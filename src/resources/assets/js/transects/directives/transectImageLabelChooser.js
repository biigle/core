/**
 * @namespace dias.ui.users
 * @ngdoc directive
 * @name transectImageLabelChooser
 * @memberOf dias.transects
 * @description An input field to find a label that was used as image label in a transect
 * @example
// HTML
<input placeholder="Search by label name" data-transect-image-label-chooser="addLabel" data-transect-id="1" />

// Controller
$scope.addLabel = function (label) {
    // do something
};

 */
angular.module('dias.transects').directive('transectImageLabelChooser', function () {
      "use strict";

      return {
         restrict: 'A',

         scope: {
            select: '=transectImageLabelChooser',
            id: '=transectId'
         },

         replace: true,

         template: '<input type="text" data-ng-model="selected" data-uib-typeahead="label.name for label in find($viewValue)" data-typeahead-wait-ms="250" data-typeahead-on-select="select($item)"/>',

         controller: function ($scope, TransectImageLabels) {
            $scope.find = function (query) {
               return TransectImageLabels.find({
                    transect_id: $scope.id,
                    query: encodeURIComponent(query)
                }).$promise;
            };
         }
      };
   }
);
