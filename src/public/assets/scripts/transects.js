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

        $scope.flag = flags.list[flagId];
    }]
);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZhY3Rvcmllcy9Bbm5vdGF0aW9uSW1hZ2UuanMiLCJjb250cm9sbGVycy9Bbm5vdGF0aW9uc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Bbm5vdGF0aW9uc0ZpbHRlckNvbnRyb2xsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7O0FBY0EsUUFBQSxPQUFBLGtCQUFBLFFBQUEsd0NBQUEsVUFBQSxXQUFBLEtBQUE7SUFDQTs7SUFFQSxPQUFBLFVBQUEsTUFBQTs7Ozs7Ozs7OztBQ1ZBLFFBQUEsT0FBQSxrQkFBQSxXQUFBLCtFQUFBLFVBQUEsUUFBQSxpQkFBQSxPQUFBLGFBQUE7UUFDQTs7UUFFQSxJQUFBLE1BQUEsZ0JBQUEsTUFBQSxDQUFBLGFBQUEsY0FBQSxZQUFBO1lBQ0EsTUFBQSxJQUFBLGtCQUFBLEtBQUEsT0FBQTs7Ozs7Ozs7Ozs7O0FDSkEsUUFBQSxPQUFBLGtCQUFBLFdBQUEsNkRBQUEsVUFBQSxRQUFBLFFBQUEsT0FBQTtRQUNBOztRQUVBLElBQUEsU0FBQTs7UUFFQSxPQUFBLGVBQUEsWUFBQTtZQUNBLE9BQUEsYUFBQTs7O1FBR0EsT0FBQSxPQUFBLE1BQUEsS0FBQTs7O0FBR0EiLCJmaWxlIjoidHJhbnNlY3RzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgQW5ub3RhdGlvbkltYWdlXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyB0aGUgcmVzb3VyY2UgZm9yIGltYWdlcyBoYXZpbmcgYW5ub3RhdGlvbnMuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIGdldCBhbGwgSURzIG9mIGltYWdlcyBoYXZpbmcgYW5ub3RhdGlvbnNcbnZhciBpZHMgPSBBbm5vdGF0aW9uSW1hZ2UucXVlcnkoe3RyYW5zZWN0X2lkOiAxfSwgZnVuY3Rpb24gKCkge1xuICAgY29uc29sZS5sb2coaWRzKTsgLy8gWzEsIDMsIDUsIDcsIC4uLl1cbn0pO1xuICpcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuZmFjdG9yeSgnQW5ub3RhdGlvbkltYWdlJywgZnVuY3Rpb24gKCRyZXNvdXJjZSwgVVJMKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICByZXR1cm4gJHJlc291cmNlKFVSTCArICcvYXBpL3YxL3RyYW5zZWN0cy86dHJhbnNlY3RfaWQvaW1hZ2VzL2hhdmluZy1hbm5vdGF0aW9ucycpO1xufSk7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBBbm5vdGF0aW9uc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnRyYW5zZWN0c1xuICogQGRlc2NyaXB0aW9uIEdsb2JhbCBjb250cm9sbGVyIGZvciB0aGUgYW5ub3RhdGlvbnMgZmVhdHVyZVxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5jb250cm9sbGVyKCdBbm5vdGF0aW9uc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJGF0dHJzLCBBbm5vdGF0aW9uSW1hZ2UsIGZsYWdzLCBUUkFOU0VDVF9JRCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgaWRzID0gQW5ub3RhdGlvbkltYWdlLnF1ZXJ5KHt0cmFuc2VjdF9pZDogVFJBTlNFQ1RfSUR9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmbGFncy5hZGQoJ2hhcy1hbm5vdGF0aW9uJywgaWRzLCAkYXR0cnMuZmxhZ1RpdGxlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnRyYW5zZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEFubm90YXRpb25zRmlsdGVyQ250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgYW5ub3RhdGlvbnMgZmlsdGVyIG1peGluXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmNvbnRyb2xsZXIoJ0Fubm90YXRpb25zRmlsdGVyQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGltYWdlcywgZmxhZ3MpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIGZsYWdJZCA9ICdoYXMtYW5ub3RhdGlvbic7XG5cbiAgICAgICAgJHNjb3BlLnRvZ2dsZUZpbHRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGltYWdlcy50b2dnbGVGaWx0ZXIoZmxhZ0lkKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZmxhZyA9IGZsYWdzLmxpc3RbZmxhZ0lkXTtcbiAgICB9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9