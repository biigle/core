/**
 * @ngdoc factory
 * @name LabelSource
 * @memberOf biigle.api
 * @description Provides the resource for finding labels from an external source.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// find labels
var labels = LabelSource.query({id: 1, query: 'Kolga'}, function () {
    console.log(labels); // [{name: 'Kolga hyalina', aphia_id: 124731, ...}, ...]
});
 *
 */
angular.module('biigle.api').factory('LabelSource', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/label-sources/:id/find');
});
