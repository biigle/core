/**
 * @ngdoc factory
 * @name ProjectVolume
 * @memberOf biigle.api
 * @description Provides the resource for volumes belonging to a project.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all volumes of the project with ID 1
var volumes = ProjectVolume.query({ project_id: 1 }, function () {
   console.log(volumes); // [{id: 1, name: "volume 1", ...}, ...]
});

// add a new volume to the project with ID 1
var volume = ProjectVolume.add({project_id: 1},
   {
      name: "volume 1",
      url: "/vol/volumes/1",
      media_type_id: 1,
      images: ["1.jpg", "2.jpg"]
   },
   function () {
      console.log(volume); // {id: 1, name: "volume 1", ...}
   }
);

// attach an existing volume to another project
var volumes = ProjectVolume.query({ project_id: 1 }, function () {
   var volume = volumes[0];
   // volume is now attached to project 1 *and* 2
   volume.$attach({project_id: 2});
});
// or directly (volume 1 will be attached to project 2)
ProjectVolume.attach({project_id: 2}, {id: 1});

// detach a volume from the project with ID 1
var volumes = ProjectVolume.query({ project_id: 1 }, function () {
   var volume = volumes[0];
   volume.$detach({project_id: 1});
});
// or directly
ProjectVolume.detach({project_id: 1}, {id: 1});

// attaching and detaching can be done using a Volume object as well:
var volume = Volume.get({id: 1}, function () {
   ProjectVolume.attach({project_id: 2}, volume);
});
 *
 */
angular.module('biigle.api').factory('ProjectVolume', function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/projects/:project_id/volumes/:id',
		{ id: '@id' },
		{
			add: { method: 'POST' },
			attach: { method: 'POST' },
			detach: { method: 'DELETE' }
		}
	);
});
