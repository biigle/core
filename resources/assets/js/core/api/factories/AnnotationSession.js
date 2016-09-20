/**
 * @ngdoc factory
 * @name AnnotationSession
 * @memberOf dias.api
 * @description Provides the resource for annotation sessions.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all annotation sessions of a transect
var sessions = AnnotationSession.query({transect_id: 123}, function () {
   console.log(sessions); //[{id: 12, name: "My session", ...}, ...]
});

// create a new annotation session
var session = AnnotationSession.create({transect_id: 123}, {
    name: 'My annotation session',
    starts_at: '2016-09-20',
    ends_at: '2016-09-25',
    description: 'This is my first annotation session!',
    hide_other_users_annotations: true,
    hide_own_annotations: false
}, function () {
    console.log(session); // {id: 12, name: "My annotation session", ...}
})

// update a session
var sessions = AnnotationSession.query({transect_id: 123}, function () {
   var session = sessions[0];
   session.name = 'Updated name';
   session.$save();
});
// or directly
AnnotationSession.save({id: 12, name: 'Updated name'});

// delete a session
var sessions = AnnotationSession.query({transect_id: 123}, function () {
   var session = sessions[0];
   session.$delete();
});
// or directly
AnnotationSession.delete({id: 12});
 *
 */
angular.module('dias.api').factory('AnnotationSession', function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/annotation-sessions/:id',
		{ id: '@id'	},
		{
			save: {
				method: 'PUT'
			},
			query: {
				method: 'GET',
                url: URL + '/api/v1/transects/:transect_id/annotation-sessions',
				isArray: true
			},
			create: {
				method: 'POST',
				url: URL + '/api/v1/transects/:transect_id/annotation-sessions',
			}
		});
});
