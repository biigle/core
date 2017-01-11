/**
 * @ngdoc factory
 * @name Ate
 * @memberOf biigle.ate
 * @description Provides the resource to save an ATE session for a transect
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// save an ATE session for transect 3
Ate.save({transect_id: 3}, {dismissed: {1: [...]}, changed: {12: 1, ...}} function () {
   // saved
});
 *
 */
angular.module('biigle.ate').factory('Ate', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/transects/:transect_id/ate');
});
