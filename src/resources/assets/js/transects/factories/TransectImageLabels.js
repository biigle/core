/**
 * @ngdoc factory
 * @name TransectImageLabels
 * @memberOf biigle.transects
 * @description Provides the resource to find labels occurring as image labels in a certain transect
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// find labels used as image labels in a transect
var labels = TransectImageLabels.find({transect_id: 1, query: 'ba'}, function () {
   console.log(labels); // [{id: 12, name: "Bad Quality", ...}, ...]
});
 *
 */
angular.module('biigle.transects').factory('TransectImageLabels', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/transects/:transect_id/image-labels/find/:query', {}, {
        find: { method: 'GET', isArray: true }
    });
});
