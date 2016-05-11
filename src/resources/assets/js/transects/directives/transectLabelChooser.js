/**
 * @namespace dias.ui.users
 * @ngdoc directive
 * @name transectLabelChooser
 * @memberOf dias.transects
 * @description An input field to find a label that was used in a transect
 * @example
// HTML
<input placeholder="Search by label name" data-transect-label-chooser="addUser" data-transect-id="1" />

 */
angular.module('dias.transects').directive('transectLabelChooser', function () {
      "use strict";

      return {
         restrict: 'A',

         scope: {
            select: '=transectLabelChooser',
            id: '=transectId'
         },

         replace: true,

         template: '<input type="text" data-ng-model="selected" data-uib-typeahead="label.name for label in find($viewValue)" data-typeahead-wait-ms="250" data-typeahead-on-select="select($item)"/>',

         controller: function ($scope, TransectLabels) {
            $scope.find = function (query) {
               return TransectLabels.find({
                    transect_id: $scope.id,
                    query: encodeURIComponent(query)
                }).$promise;
            };
         }
      };
   }
);
