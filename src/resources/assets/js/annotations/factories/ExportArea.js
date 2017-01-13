/**
 * @ngdoc factory
 * @name ExportArea
 * @memberOf biigle.annotations
 * @description Provides the resource for the export area of a volume
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get the export area
var area = ExportArea.query({volume_id: 1}, function () {
   console.log(area); // [10, 20, 30, 40]
});

// set the area
ExportArea.save({volume_id: 1}, {coordinates: [10, 20, 30, 40]});

// delete the area
ExportArea.delete({volume_id: 1});
 *
 */
angular.module('biigle.annotations').factory('ExportArea', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/volumes/:volume_id/export-area');
});
