/**
 * @ngdoc factory
 * @name TransectLabels
 * @memberOf dias.transects
 * @description Provides the resource to find labels occurring in a certain transect
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// find label categories used in a transect
var labels = TransectLabels.find({transect_id: 1, query: 'an'}, function () {
   console.log(labels); // [{id: 12, name: "Anemone", ...}, ...]
});
 *
 */
angular.module('dias.transects').factory('TransectLabels', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/transects/:transect_id/labels/find/:query', {}, {
        find: { method: 'GET', isArray: true }
    });
});
