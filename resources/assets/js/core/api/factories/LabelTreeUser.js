/**
 * @ngdoc factory
 * @name LabelTreeUser
 * @memberOf dias.api
 * @description Provides the resource for users belonging to a label tree.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// update the role of a user
LabelTreeUser.update({project_id: 1}, {id: 1, role_id: 1});

// attach a user to a label tree
LabelTreeUser.attach({project_id: 2}, {id: 1, role_id: 2});

// detach a user from the label tree with ID 1
LabelTreeUser.detach({project_id: 1}, {id: 1});
 *
 */
angular.module('dias.api').factory('LabelTreeUser', function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/label-trees/:label_tree_id/users/:id',
		{ id: '@id' },
		{
			update: { method: 'PUT' },
			attach: {
                method: 'POST',
                url: URL + '/api/v1/label-trees/:label_tree_id/users',
                params: {id: null}
            },
			detach: { method: 'DELETE' }
		}
	);
});
