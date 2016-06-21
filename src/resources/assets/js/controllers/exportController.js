/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name FilterController
 * @memberOf dias.transects
 * @description Controller for the filter feature of the transects page
 */
angular.module('dias.projects').controller('exportController', function ($scope,$http,URL,msg) {
        "use strict";
        $scope.basic=function(projectid){
            msg.success("The report will be prepared. You will get notified by email when it is ready.");
            $http({
                method: 'GET',
                url: URL+"/api/v1/projects/"+projectid+"/reports/basic"
            }).then(function successCallback(response) {
            }, function errorCallback(response) {
                    msg.danger("An error occured. If you keep getting this error please contact the administrator.");
            });
        };
        $scope.extended=function(projectid){
            msg.success("The report will be prepared. You will get notified by email when it is ready.");
            $http({
                method: 'GET',
                url: URL+"/api/v1/projects/"+projectid+"/reports/extended"
            }).then(function successCallback(response) {
            }, function errorCallback(response) {
                    msg.danger("An error occured. If you keep getting this error please contact the administrator.");
            });
        };
        $scope.full=function(projectid){
                       msg.success("The report will be prepared. You will get notified by email when it is ready.");
            $http({
                method: 'GET',
                url: URL+"/api/v1/projects/"+projectid+"/reports/full"
            }).then(function successCallback(response) {
            }, function errorCallback(response) {
                    msg.danger("An error occured. If you keep getting this error please contact the administrator.");
            });
        };
    }
);
