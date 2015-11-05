/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectDeleteController
 * @memberOf dias.projects
 * @description Initiates the deletion confirmation modal
 * @example

 */
angular.module('dias.projects').controller('ProjectDeleteController', function ($scope, $uibModal, $attrs, msg) {
      "use strict";

      var success = function () {
         $scope.redirectToDashboard($attrs.successMsg);
      };

      var error = function () {
         msg.danger($attrs.errorMsg);
      };

      $scope.submit = function () {
         var modalInstance = $uibModal.open({
            templateUrl: 'confirmDeleteModal.html',
            size: 'sm',
            controller: 'ProjectDeleteModalController',
            scope: $scope
         });

         modalInstance.result.then(function (result) {
            switch (result) {
               case 'success':
                  success();
                  break;
               case 'error':
                  error();
                  break;
            }
         });
      };
   }
);
