/**
 * @ngdoc factory
 * @name ProjectTransect
 * @memberOf biigle.api
 * @description Provides the resource for transects belonging to a project.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all transects of the project with ID 1
var transects = ProjectTransect.query({ project_id: 1 }, function () {
   console.log(transects); // [{id: 1, name: "transect 1", ...}, ...]
});

// add a new transect to the project with ID 1
var transect = ProjectTransect.add({project_id: 1},
   {
      name: "transect 1",
      url: "/vol/transects/1",
      media_type_id: 1,
      images: ["1.jpg", "2.jpg"]
   },
   function () {
      console.log(transect); // {id: 1, name: "transect 1", ...}
   }
);

// attach an existing transect to another project
var transects = ProjectTransect.query({ project_id: 1 }, function () {
   var transect = transects[0];
   // transect is now attached to project 1 *and* 2
   transect.$attach({project_id: 2});
});
// or directly (transect 1 will be attached to project 2)
ProjectTransect.attach({project_id: 2}, {id: 1});

// detach a transect from the project with ID 1
var transects = ProjectTransect.query({ project_id: 1 }, function () {
   var transect = transects[0];
   transect.$detach({project_id: 1});
});
// or directly
ProjectTransect.detach({project_id: 1}, {id: 1});

// attaching and detaching can be done using a Transect object as well:
var transect = Transect.get({id: 1}, function () {
   ProjectTransect.attach({project_id: 2}, transect);
});
 *
 */
angular.module('biigle.api').factory('ProjectTransect', function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/projects/:project_id/transects/:id',
		{ id: '@id' },
		{
			add: { method: 'POST' },
			attach: { method: 'POST' },
			detach: { method: 'DELETE' }
		}
	);
});
