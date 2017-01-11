/**
 * @ngdoc factory
 * @name TransectAnnotationLabels
 * @memberOf biigle.transects
 * @description Provides the resource to find labels occurring as annotation labels in a certain transect
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// find label categories used in a transect
var labels = TransectAnnotationLabels.find({transect_id: 1, query: 'an'}, function () {
   console.log(labels); // [{id: 12, name: "Anemone", ...}, ...]
});
 *
 */
angular.module('biigle.transects').factory('TransectAnnotationLabels', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/transects/:transect_id/annotation-labels/find/:query', {}, {
        find: { method: 'GET', isArray: true }
    });
});
