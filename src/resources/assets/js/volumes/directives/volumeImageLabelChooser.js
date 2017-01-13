/**
 * @namespace biigle.ui.users
 * @ngdoc directive
 * @name volumeImageLabelChooser
 * @memberOf biigle.volumes
 * @description An input field to find a label that was used as image label in a volume
 * @example
// HTML
<input placeholder="Search by label name" data-volume-image-label-chooser="addLabel" data-volume-id="1" />

// Controller
$scope.addLabel = function (label) {
    // do something
};

 */
angular.module('biigle.volumes').directive('volumeImageLabelChooser', function () {
      "use strict";

      return {
         restrict: 'A',

         scope: {
            select: '=volumeImageLabelChooser',
            id: '=volumeId'
         },

         replace: true,

         template: '<input type="text" data-ng-model="selected" data-uib-typeahead="label.name for label in find($viewValue)" data-typeahead-wait-ms="250" data-typeahead-on-select="select($item)"/>',

         controller: function ($scope, VolumeImageLabels) {
            $scope.find = function (query) {
               return VolumeImageLabels.find({
                    volume_id: $scope.id,
                    query: encodeURIComponent(query)
                }).$promise;
            };
         }
      };
   }
);
