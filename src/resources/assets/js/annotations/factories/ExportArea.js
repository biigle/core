/**
 * @ngdoc factory
 * @name ExportArea
 * @memberOf biigle.annotations
 * @description Provides the resource for the export area of a transect
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get the export area
var area = ExportArea.query({transect_id: 1}, function () {
   console.log(area); // [10, 20, 30, 40]
});

// set the area
ExportArea.save({transect_id: 1}, {coordinates: [10, 20, 30, 40]});

// delete the area
ExportArea.delete({transect_id: 1});
 *
 */
angular.module('biigle.annotations').factory('ExportArea', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/transects/:transect_id/export-area');
});
