/**
 * @namespace dias.core
 * @description The DIAS core AngularJS module.
 */
angular.module('dias.core', ['ngResource']);

angular.module('dias.core').config(["$httpProvider", function ($httpProvider) {
	"use strict";

	$httpProvider.defaults.headers.common["X-Requested-With"] =
		"XMLHttpRequest";
}]);

/**
 * @ngdoc factory
 * @name Annotation
 * @memberOf dias.core
 * @description Provides the resource for an annotation.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// retrieving the points of an annotation
var annotation = Annotation.get({id: 123}, function () {
   console.log(annotaion.points);
});

// deleting an annotation
var annotation = Annotation.get({id: 123}, function () {
   annotation.$delete();
});
 * 
 */
angular.module('dias.core').factory('Annotation', ["$resource", function ($resource) {
	"use strict";

	return $resource('/api/v1/annotations/:id', {id: '@id'});
}]);
/**
 * @ngdoc factory
 * @name OwnUser
 * @memberOf dias.core
 * @description Provides the resource for the logged in user.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// retrieving the username
var user = OwnUser.get({}, function () {
   console.log(user.firstname);
});

// changing the username
var user = OwnUser.get({}, function () {
   user.firstname == 'Joel';
   user.$save();
});

// deleting the user
var user = OwnUser.get({}, function () {
   user.$delete();
});
 * 
 */
angular.module('dias.core').factory('OwnUser', ["$resource", function ($resource) {
	"use strict";

	return $resource('/api/v1/users/my', {}, {
		save: {method: 'PUT'}
	});
}]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJmYWN0b3JpZXMvQW5ub3RhdGlvbi5qcyIsImZhY3Rvcmllcy9Pd25Vc2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmNvcmVcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyBjb3JlIEFuZ3VsYXJKUyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmNvcmUnLCBbJ25nUmVzb3VyY2UnXSk7XG5cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmNvcmUnKS5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0JGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbltcIlgtUmVxdWVzdGVkLVdpdGhcIl0gPVxuXHRcdFwiWE1MSHR0cFJlcXVlc3RcIjtcbn0pO1xuIiwiLyoqXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgQW5ub3RhdGlvblxuICogQG1lbWJlck9mIGRpYXMuY29yZVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIHRoZSByZXNvdXJjZSBmb3IgYW4gYW5ub3RhdGlvbi5cbiAqIEByZXF1aXJlcyAkcmVzb3VyY2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IFtuZ1Jlc291cmNlXShodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmdSZXNvdXJjZS9zZXJ2aWNlLyRyZXNvdXJjZSkgb2JqZWN0XG4gKiBAZXhhbXBsZVxuLy8gcmV0cmlldmluZyB0aGUgcG9pbnRzIG9mIGFuIGFubm90YXRpb25cbnZhciBhbm5vdGF0aW9uID0gQW5ub3RhdGlvbi5nZXQoe2lkOiAxMjN9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyhhbm5vdGFpb24ucG9pbnRzKTtcbn0pO1xuXG4vLyBkZWxldGluZyBhbiBhbm5vdGF0aW9uXG52YXIgYW5ub3RhdGlvbiA9IEFubm90YXRpb24uZ2V0KHtpZDogMTIzfSwgZnVuY3Rpb24gKCkge1xuICAgYW5ub3RhdGlvbi4kZGVsZXRlKCk7XG59KTtcbiAqIFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5jb3JlJykuZmFjdG9yeSgnQW5ub3RhdGlvbicsIGZ1bmN0aW9uICgkcmVzb3VyY2UpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0cmV0dXJuICRyZXNvdXJjZSgnL2FwaS92MS9hbm5vdGF0aW9ucy86aWQnLCB7aWQ6ICdAaWQnfSk7XG59KTsiLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBPd25Vc2VyXG4gKiBAbWVtYmVyT2YgZGlhcy5jb3JlXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciB0aGUgbG9nZ2VkIGluIHVzZXIuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbi8vIHJldHJpZXZpbmcgdGhlIHVzZXJuYW1lXG52YXIgdXNlciA9IE93blVzZXIuZ2V0KHt9LCBmdW5jdGlvbiAoKSB7XG4gICBjb25zb2xlLmxvZyh1c2VyLmZpcnN0bmFtZSk7XG59KTtcblxuLy8gY2hhbmdpbmcgdGhlIHVzZXJuYW1lXG52YXIgdXNlciA9IE93blVzZXIuZ2V0KHt9LCBmdW5jdGlvbiAoKSB7XG4gICB1c2VyLmZpcnN0bmFtZSA9PSAnSm9lbCc7XG4gICB1c2VyLiRzYXZlKCk7XG59KTtcblxuLy8gZGVsZXRpbmcgdGhlIHVzZXJcbnZhciB1c2VyID0gT3duVXNlci5nZXQoe30sIGZ1bmN0aW9uICgpIHtcbiAgIHVzZXIuJGRlbGV0ZSgpO1xufSk7XG4gKiBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuY29yZScpLmZhY3RvcnkoJ093blVzZXInLCBmdW5jdGlvbiAoJHJlc291cmNlKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoJy9hcGkvdjEvdXNlcnMvbXknLCB7fSwge1xuXHRcdHNhdmU6IHttZXRob2Q6ICdQVVQnfVxuXHR9KTtcbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==