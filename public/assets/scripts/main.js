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
 * @name OwnUser
 * @memberOf dias.core
 * @description Provides the resource for the logged in user.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
var user = OwnUser.get({}, function () {
   user.firstname == 'Joel';
   user.$save();
})
 * 
 */
angular.module('dias.core').factory('OwnUser', ["$resource", function ($resource) {
	"use strict";

	return $resource('/api/v1/users/my', {}, {
		save: {method: 'PUT'}
	});
}]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJmYWN0b3JpZXMvT3duVXNlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuY29yZVxuICogQGRlc2NyaXB0aW9uIFRoZSBESUFTIGNvcmUgQW5ndWxhckpTIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuY29yZScsIFsnbmdSZXNvdXJjZSddKTtcblxuYW5ndWxhci5tb2R1bGUoJ2RpYXMuY29yZScpLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHQkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uW1wiWC1SZXF1ZXN0ZWQtV2l0aFwiXSA9XG5cdFx0XCJYTUxIdHRwUmVxdWVzdFwiO1xufSk7XG4iLCIvKipcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBPd25Vc2VyXG4gKiBAbWVtYmVyT2YgZGlhcy5jb3JlXG4gKiBAZGVzY3JpcHRpb24gUHJvdmlkZXMgdGhlIHJlc291cmNlIGZvciB0aGUgbG9nZ2VkIGluIHVzZXIuXG4gKiBAcmVxdWlyZXMgJHJlc291cmNlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBbbmdSZXNvdXJjZV0oaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nUmVzb3VyY2Uvc2VydmljZS8kcmVzb3VyY2UpIG9iamVjdFxuICogQGV4YW1wbGVcbnZhciB1c2VyID0gT3duVXNlci5nZXQoe30sIGZ1bmN0aW9uICgpIHtcbiAgIHVzZXIuZmlyc3RuYW1lID09ICdKb2VsJztcbiAgIHVzZXIuJHNhdmUoKTtcbn0pXG4gKiBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuY29yZScpLmZhY3RvcnkoJ093blVzZXInLCBmdW5jdGlvbiAoJHJlc291cmNlKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHJldHVybiAkcmVzb3VyY2UoJy9hcGkvdjEvdXNlcnMvbXknLCB7fSwge1xuXHRcdHNhdmU6IHttZXRob2Q6ICdQVVQnfVxuXHR9KTtcbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==