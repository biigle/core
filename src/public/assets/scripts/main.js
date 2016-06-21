/**
 * @namespace dias.transects
 * @description The DIAS transects module.
 */
angular.module('dias.export', ['dias.api', 'dias.ui']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('dias.export').config(["$compileProvider", function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
}]);

/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name FilterController
 * @memberOf dias.transects
 * @description Controller for the filter feature of the transects page
 */
angular.module('dias.projects').controller('exportController', ["$scope", "$http", "URL", "msg", function ($scope,$http,URL,msg) {
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
    }]
);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9leHBvcnRDb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUEsUUFBQSxPQUFBLGVBQUEsQ0FBQSxZQUFBOzs7Ozs7QUFNQSxRQUFBLE9BQUEsZUFBQSw0QkFBQSxVQUFBLGtCQUFBO0lBQ0E7O0lBRUEsaUJBQUEsaUJBQUE7Ozs7Ozs7Ozs7QUNOQSxRQUFBLE9BQUEsaUJBQUEsV0FBQSxzREFBQSxVQUFBLE9BQUEsTUFBQSxJQUFBLEtBQUE7UUFDQTtRQUNBLE9BQUEsTUFBQSxTQUFBLFVBQUE7WUFDQSxJQUFBLFFBQUE7WUFDQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQSxJQUFBLG9CQUFBLFVBQUE7ZUFDQSxLQUFBLFNBQUEsZ0JBQUEsVUFBQTtlQUNBLFNBQUEsY0FBQSxVQUFBO29CQUNBLElBQUEsT0FBQTs7O1FBR0EsT0FBQSxTQUFBLFNBQUEsVUFBQTtZQUNBLElBQUEsUUFBQTtZQUNBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLElBQUEsb0JBQUEsVUFBQTtlQUNBLEtBQUEsU0FBQSxnQkFBQSxVQUFBO2VBQ0EsU0FBQSxjQUFBLFVBQUE7b0JBQ0EsSUFBQSxPQUFBOzs7UUFHQSxPQUFBLEtBQUEsU0FBQSxVQUFBO3VCQUNBLElBQUEsUUFBQTtZQUNBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLElBQUEsb0JBQUEsVUFBQTtlQUNBLEtBQUEsU0FBQSxnQkFBQSxVQUFBO2VBQ0EsU0FBQSxjQUFBLFVBQUE7b0JBQ0EsSUFBQSxPQUFBOzs7OztBQUtBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyB0cmFuc2VjdHMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5leHBvcnQnLCBbJ2RpYXMuYXBpJywgJ2RpYXMudWknXSk7XG5cbi8qXG4gKiBEaXNhYmxlIGRlYnVnIGluZm8gaW4gcHJvZHVjdGlvbiBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlLlxuICogc2VlOiBodHRwczovL2NvZGUuYW5ndWxhcmpzLm9yZy8xLjQuNy9kb2NzL2d1aWRlL3Byb2R1Y3Rpb25cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuZXhwb3J0JykuY29uZmlnKGZ1bmN0aW9uICgkY29tcGlsZVByb3ZpZGVyKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAkY29tcGlsZVByb3ZpZGVyLmRlYnVnSW5mb0VuYWJsZWQoZmFsc2UpO1xufSk7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBGaWx0ZXJDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgZmlsdGVyIGZlYXR1cmUgb2YgdGhlIHRyYW5zZWN0cyBwYWdlXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJykuY29udHJvbGxlcignZXhwb3J0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsJGh0dHAsVVJMLG1zZykge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcbiAgICAgICAgJHNjb3BlLmJhc2ljPWZ1bmN0aW9uKHByb2plY3RpZCl7XG4gICAgICAgICAgICBtc2cuc3VjY2VzcyhcIlRoZSByZXBvcnQgd2lsbCBiZSBwcmVwYXJlZC4gWW91IHdpbGwgZ2V0IG5vdGlmaWVkIGJ5IGVtYWlsIHdoZW4gaXQgaXMgcmVhZHkuXCIpO1xuICAgICAgICAgICAgJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBVUkwrXCIvYXBpL3YxL3Byb2plY3RzL1wiK3Byb2plY3RpZCtcIi9yZXBvcnRzL2Jhc2ljXCJcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiBlcnJvckNhbGxiYWNrKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIG1zZy5kYW5nZXIoXCJBbiBlcnJvciBvY2N1cmVkLiBJZiB5b3Uga2VlcCBnZXR0aW5nIHRoaXMgZXJyb3IgcGxlYXNlIGNvbnRhY3QgdGhlIGFkbWluaXN0cmF0b3IuXCIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5leHRlbmRlZD1mdW5jdGlvbihwcm9qZWN0aWQpe1xuICAgICAgICAgICAgbXNnLnN1Y2Nlc3MoXCJUaGUgcmVwb3J0IHdpbGwgYmUgcHJlcGFyZWQuIFlvdSB3aWxsIGdldCBub3RpZmllZCBieSBlbWFpbCB3aGVuIGl0IGlzIHJlYWR5LlwiKTtcbiAgICAgICAgICAgICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogVVJMK1wiL2FwaS92MS9wcm9qZWN0cy9cIitwcm9qZWN0aWQrXCIvcmVwb3J0cy9leHRlbmRlZFwiXG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZSkge1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24gZXJyb3JDYWxsYmFjayhyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBtc2cuZGFuZ2VyKFwiQW4gZXJyb3Igb2NjdXJlZC4gSWYgeW91IGtlZXAgZ2V0dGluZyB0aGlzIGVycm9yIHBsZWFzZSBjb250YWN0IHRoZSBhZG1pbmlzdHJhdG9yLlwiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuZnVsbD1mdW5jdGlvbihwcm9qZWN0aWQpe1xuICAgICAgICAgICAgICAgICAgICAgICBtc2cuc3VjY2VzcyhcIlRoZSByZXBvcnQgd2lsbCBiZSBwcmVwYXJlZC4gWW91IHdpbGwgZ2V0IG5vdGlmaWVkIGJ5IGVtYWlsIHdoZW4gaXQgaXMgcmVhZHkuXCIpO1xuICAgICAgICAgICAgJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBVUkwrXCIvYXBpL3YxL3Byb2plY3RzL1wiK3Byb2plY3RpZCtcIi9yZXBvcnRzL2Z1bGxcIlxuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UpIHtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIGVycm9yQ2FsbGJhY2socmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgbXNnLmRhbmdlcihcIkFuIGVycm9yIG9jY3VyZWQuIElmIHlvdSBrZWVwIGdldHRpbmcgdGhpcyBlcnJvciBwbGVhc2UgY29udGFjdCB0aGUgYWRtaW5pc3RyYXRvci5cIik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
