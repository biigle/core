/**
 * @namespace biigle.ui.users
 * @ngdoc directive
 * @name volumeAnnotationLabelChooser
 * @memberOf biigle.volumes
 * @description An input field to find a label that was used as annotation label in a volume
 * @example
// HTML
<input placeholder="Search by label name" data-volume-annotation-label-chooser="addLabel" data-volume-id="1" />

// Controller
$scope.addLabel = function (label) {
    // do something
};

 */
angular.module('biigle.volumes').directive('volumeAnnotationLabelChooser', function () {
      "use strict";

      return {
         restrict: 'A',

         scope: {
            select: '=volumeAnnotationLabelChooser',
            id: '=volumeId'
         },

         replace: true,

         template: '<input type="text" data-ng-model="selected" data-uib-typeahead="label.name for label in find($viewValue)" data-typeahead-wait-ms="250" data-typeahead-on-select="select($item)"/>',

         controller: function ($scope, VolumeAnnotationLabels) {
            $scope.find = function (query) {
               return VolumeAnnotationLabels.find({
                    volume_id: $scope.id,
                    query: encodeURIComponent(query)
                }).$promise;
            };
         }
      };
   }
);
