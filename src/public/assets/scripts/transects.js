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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbnRyb2xsZXJzL0Fubm90YXRpb25zQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0Fubm90YXRpb25zRmlsdGVyQ29udHJvbGxlci5qcyIsImZhY3Rvcmllcy9Bbm5vdGF0aW9uSW1hZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUFPQSxRQUFBLE9BQUEsa0JBQUEsV0FBQSwrRUFBQSxVQUFBLFFBQUEsaUJBQUEsT0FBQSxhQUFBO1FBQ0E7O1FBRUEsSUFBQSxNQUFBLGdCQUFBLE1BQUEsQ0FBQSxhQUFBLGNBQUEsWUFBQTtZQUNBLE1BQUEsSUFBQSxrQkFBQSxLQUFBLE9BQUE7Ozs7Ozs7Ozs7OztBQ0pBLFFBQUEsT0FBQSxrQkFBQSxXQUFBLDZEQUFBLFVBQUEsUUFBQSxRQUFBLE9BQUE7UUFDQTs7UUFFQSxJQUFBLFNBQUE7O1FBRUEsT0FBQSxlQUFBLFlBQUE7WUFDQSxPQUFBLGFBQUE7OztRQUdBLE9BQUEsT0FBQSxNQUFBLEtBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0ZBLFFBQUEsT0FBQSxrQkFBQSxRQUFBLHdDQUFBLFVBQUEsV0FBQSxLQUFBO0lBQ0E7O0lBRUEsT0FBQSxVQUFBLE1BQUE7O0FBRUEiLCJmaWxlIjoidHJhbnNlY3RzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMudHJhbnNlY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQW5ub3RhdGlvbnNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy50cmFuc2VjdHNcbiAqIEBkZXNjcmlwdGlvbiBHbG9iYWwgY29udHJvbGxlciBmb3IgdGhlIGFubm90YXRpb25zIGZlYXR1cmVcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMudHJhbnNlY3RzJykuY29udHJvbGxlcignQW5ub3RhdGlvbnNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRhdHRycywgQW5ub3RhdGlvbkltYWdlLCBmbGFncywgVFJBTlNFQ1RfSUQpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIGlkcyA9IEFubm90YXRpb25JbWFnZS5xdWVyeSh7dHJhbnNlY3RfaWQ6IFRSQU5TRUNUX0lEfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZmxhZ3MuYWRkKCdoYXMtYW5ub3RhdGlvbicsIGlkcywgJGF0dHJzLmZsYWdUaXRsZSk7XG4gICAgICAgIH0pO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy50cmFuc2VjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBBbm5vdGF0aW9uc0ZpbHRlckNudHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIGFubm90YXRpb25zIGZpbHRlciBtaXhpblxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy50cmFuc2VjdHMnKS5jb250cm9sbGVyKCdBbm5vdGF0aW9uc0ZpbHRlckNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBpbWFnZXMsIGZsYWdzKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBmbGFnSWQgPSAnaGFzLWFubm90YXRpb24nO1xuXG4gICAgICAgICRzY29wZS50b2dnbGVGaWx0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpbWFnZXMudG9nZ2xlRmlsdGVyKGZsYWdJZCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmZsYWcgPSBmbGFncy5saXN0W2ZsYWdJZF07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIEFubm90YXRpb25JbWFnZVxuICogQG1lbWJlck9mIGRpYXMudHJhbnNlY3RzXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciBpbWFnZXMgaGF2aW5nIGFubm90YXRpb25zLlxuICogQHJlcXVpcmVzICRyZXNvdXJjZVxuICogQHJldHVybnMge09iamVjdH0gQSBuZXcgW25nUmVzb3VyY2VdKGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2FwaS9uZ1Jlc291cmNlL3NlcnZpY2UvJHJlc291cmNlKSBvYmplY3RcbiAqIEBleGFtcGxlXG4vLyBnZXQgYWxsIElEcyBvZiBpbWFnZXMgaGF2aW5nIGFubm90YXRpb25zXG52YXIgaWRzID0gQW5ub3RhdGlvbkltYWdlLnF1ZXJ5KHt0cmFuc2VjdF9pZDogMX0sIGZ1bmN0aW9uICgpIHtcbiAgIGNvbnNvbGUubG9nKGlkcyk7IC8vIFsxLCAzLCA1LCA3LCAuLi5dXG59KTtcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnRyYW5zZWN0cycpLmZhY3RvcnkoJ0Fubm90YXRpb25JbWFnZScsIGZ1bmN0aW9uICgkcmVzb3VyY2UsIFVSTCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgcmV0dXJuICRyZXNvdXJjZShVUkwgKyAnL2FwaS92MS90cmFuc2VjdHMvOnRyYW5zZWN0X2lkL2ltYWdlcy9oYXZpbmctYW5ub3RhdGlvbnMnKTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9