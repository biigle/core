/**
 * @ngdoc factory
 * @name Largo
 * @memberOf biigle.largo
 * @description Provides the resource to save an Largo session for a volume
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// save an Largo session for volume 3
Largo.save({volume_id: 3}, {dismissed: {1: [...]}, changed: {12: 1, ...}} function () {
   // saved
});
 *
 */
angular.module('biigle.largo').factory('Largo', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/volumes/:volume_id/largo');
});
