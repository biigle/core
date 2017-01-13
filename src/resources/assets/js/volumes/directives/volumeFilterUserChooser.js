/**
 * @namespace biigle.ui.users
 * @ngdoc directive
 * @name volumeFilterUserChooser
 * @memberOf biigle.volumes
 * @description An input field to find a user which can be used for the volume filter mechanism
 * @example
// HTML
<input placeholder="Search by user name" data-volume-filter-user-chooser="addUser" />

// Controller
$scope.addUser = function (user) {
    // do something
};

 */
angular.module('biigle.volumes').directive('volumeFilterUserChooser', function () {
      "use strict";

      return {
         restrict: 'A',

         scope: {
            select: '=volumeFilterUserChooser',
         },

         replace: true,

         template: '<input type="text" data-ng-model="selected" data-uib-typeahead="name(user) for user in find($viewValue)" data-typeahead-wait-ms="250" data-typeahead-on-select="select($item)"/>',

         controller: function ($scope, VolumeFilterUser) {
            $scope.name = function (user) {
                if (user && user.firstname && user.lastname) {
                    return user.firstname + ' ' + user.lastname;
                }

                return '';
            };

            $scope.find = function (query) {
               return VolumeFilterUser.find({
                    query: encodeURIComponent(query)
                }).$promise;
            };
         }
      };
   }
);
