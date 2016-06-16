/**
 * @namespace dias.ui.users
 * @ngdoc directive
 * @name transectFilterUserChooser
 * @memberOf dias.transects
 * @description An input field to find a user which can be used for the transect filter mechanism
 * @example
// HTML
<input placeholder="Search by user name" data-transect-filter-user-chooser="addUser" />

// Controller
$scope.addUser = function (user) {
    // do something
};

 */
angular.module('dias.transects').directive('transectFilterUserChooser', function () {
      "use strict";

      return {
         restrict: 'A',

         scope: {
            select: '=transectFilterUserChooser',
         },

         replace: true,

         template: '<input type="text" data-ng-model="selected" data-uib-typeahead="name(user) for user in find($viewValue)" data-typeahead-wait-ms="250" data-typeahead-on-select="select($item)"/>',

         controller: function ($scope, TransectFilterUser) {
            $scope.name = function (user) {
                if (user && user.firstname && user.lastname) {
                    return user.firstname + ' ' + user.lastname;
                }

                return '';
            };

            $scope.find = function (query) {
               return TransectFilterUser.find({
                    query: encodeURIComponent(query)
                }).$promise;
            };
         }
      };
   }
);
