/**
 * @ngdoc factory
 * @name LabelTreeAuthorizedProject
 * @memberOf biigle.api
 * @description Provides the resource label tree projects
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// add an authorized project (with ID 1) to the label tree (with ID 4)
LabelTreeAuthorizedProject.addAuthorized({id: 1}, {id: 4}, function () {
    // authorized
});

// remove an authorized project (with ID 1) from the label tree (with ID 4)
LabelTreeAuthorizedProject.removeAuthorized({id: 1}, {id: 4}, function () {
    // removed
});
 *
 */
angular.module('biigle.api').factory('LabelTreeAuthorizedProject', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/label-trees/:id/authorized-projects', {}, {
        addAuthorized: {
            method: 'POST'
        },
        removeAuthorized: {
            method: 'DELETE',
            url: URL + '/api/v1/label-trees/:id/authorized-projects/:pid',
            params: {
                pid: '@id'
            }
        }
    });
});
