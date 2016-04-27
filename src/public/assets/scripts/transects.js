/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name AnnotationsController
 * @memberOf dias.transects
 * @description Global controller for the annotations feature
 */
angular.module('dias.transects').controller('AnnotationsController', ["$attrs", "AnnotationImage", "flags", "TRANSECT_ID", function ($attrs, AnnotationImage, flags, TRANSECT_ID) {
        "use strict";

        var ids = AnnotationImage.query({transect_id: TRANSECT_ID}, function () {
            flags.add('has-annotation', ids, $attrs.flagTitle);
        });
    }]
);

/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name AnnotationsFilterCntroller
 * @memberOf dias.transects
 * @description Controller for the annotations filter mixin
 */
angular.module('dias.transects').controller('AnnotationsFilterController', ["$scope", "images", "flags", function ($scope, images, flags) {
        "use strict";

        var flagId = 'has-annotation';

        $scope.toggleFilter = function () {
            images.toggleFilter(flagId);
        };

        $scope.toggleNegateFilter = function () {
            images.toggleNegateFilter(flagId);
        };

        $scope.flag = flags.list[flagId];
    }]
);

/**
 * @ngdoc factory
 * @name AnnotationImage
 * @memberOf dias.transects
 * @description Provides the resource for images having annotations.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all IDs of images having annotations
var ids = AnnotationImage.query({transect_id: 1}, function () {
   console.log(ids); // [1, 3, 5, 7, ...]
});
 *
 */
angular.module('dias.transects').factory('AnnotationImage', ["$resource", "URL", function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/transects/:transect_id/images/having-annotations');
}]);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbnRyb2xsZXJzL0Fubm90YXRpb25zQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0Fubm90YXRpb25zRmlsdGVyQ29udHJvbGxlci5qcyIsImZhY3Rvcmllcy9Bbm5vdGF0aW9uSW1hZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUFPQSxRQUFBLE9BQUEsa0JBQUEsV0FBQSwrRUFBQSxVQUFBLFFBQUEsaUJBQUEsT0FBQSxhQUFBO1FBQ0E7O1FBRUEsSUFBQSxNQUFBLGdCQUFBLE1BQUEsQ0FBQSxhQUFBLGNBQUEsWUFBQTtZQUNBLE1BQUEsSUFBQSxrQkFBQSxLQUFBLE9BQUE7Ozs7Ozs7Ozs7OztBQ0pBLFFBQUEsT0FBQSxrQkFBQSxXQUFBLDZEQUFBLFVBQUEsUUFBQSxRQUFBLE9BQUE7UUFDQTs7UUFFQSxJQUFBLFNBQUE7O1FBRUEsT0FBQSxlQUFBLFlBQUE7WUFDQSxPQUFBLGFBQUE7OztRQUdBLE9BQUEscUJBQUEsWUFBQTtZQUNBLE9BQUEsbUJBQUE7OztRQUdBLE9BQUEsT0FBQSxNQUFBLEtBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ05BLFFBQUEsT0FBQSxrQkFBQSxRQUFBLHdDQUFBLFVBQUEsV0FBQSxLQUFBO0lBQ0E7O0lBRUEsT0FBQSxVQUFBLE1BQUE7O0FBRUEiLCJmaWxlIjoidHJhbnNlY3RzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQW5ub3RhdGlvbnNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBHbG9iYWwgY29udHJvbGxlciBmb3IgdGhlIGFubm90YXRpb25zIGZlYXR1cmVcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuY29udHJvbGxlcignQW5ub3RhdGlvbnNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRhdHRycywgQW5ub3RhdGlvbkltYWdlLCBmbGFncywgVFJBTlNFQ1RfSUQpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIGlkcyA9IEFubm90YXRpb25JbWFnZS5xdWVyeSh7dHJhbnNlY3RfaWQ6IFRSQU5TRUNUX0lEfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZmxhZ3MuYWRkKCdoYXMtYW5ub3RhdGlvbicsIGlkcywgJGF0dHJzLmZsYWdUaXRsZSk7XG4gICAgICAgIH0pO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBBbm5vdGF0aW9uc0ZpbHRlckNudHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIGFubm90YXRpb25zIGZpbHRlciBtaXhpblxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5jb250cm9sbGVyKCdBbm5vdGF0aW9uc0ZpbHRlckNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBpbWFnZXMsIGZsYWdzKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBmbGFnSWQgPSAnaGFzLWFubm90YXRpb24nO1xuXG4gICAgICAgICRzY29wZS50b2dnbGVGaWx0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpbWFnZXMudG9nZ2xlRmlsdGVyKGZsYWdJZCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnRvZ2dsZU5lZ2F0ZUZpbHRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGltYWdlcy50b2dnbGVOZWdhdGVGaWx0ZXIoZmxhZ0lkKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZmxhZyA9IGZsYWdzLmxpc3RbZmxhZ0lkXTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgQW5ub3RhdGlvbkltYWdlXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIGltYWdlcyBoYXZpbmcgYW5ub3RhdGlvbnMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbGwgSURzIG9mIGltYWdlcyBoYXZpbmcgYW5ub3RhdGlvbnNcbnZhciBpZHMgPSBBbm5vdGF0aW9uSW1hZ2UucXVlcnkoe3RyYW5zZWN0X2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2coaWRzKTsgLy8gWzEsIDMsIDUsIDcsIC4uLl1cbn0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuZmFjdG9yeSgnQW5ub3RhdGlvbkltYWdlJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICByZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3RyYW5zZWN0cy86dHJhbnNlY3RfaWQvaW1hZ2VzL2hhdmluZy1hbm5vdGF0aW9ucycpO1xufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
