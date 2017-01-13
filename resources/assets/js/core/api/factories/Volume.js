/**
 * @ngdoc factory
 * @name Volume
 * @memberOf biigle.api
 * @description Provides the resource for volumes.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get one volume
var volume = Volume.get({id: 1}, function () {
   console.log(volume); // {id: 1, name: "volume 1"}
});

// update a volume
var volume = Volume.get({id: 1}, function () {
   volume.name = "my volume";
   volume.$save();
});
// or directly
Volume.save({id: 1, name: "my volume"});
 *
 */
angular.module('biigle.api').factory('Volume', function ($resource, URL) {
   "use strict";

   return $resource(URL + '/api/v1/volumes/:id',
      { id: '@id' },
      {
         save: { method: 'PUT' }
      }
   );
});
