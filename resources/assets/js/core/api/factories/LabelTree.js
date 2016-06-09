/**
 * @ngdoc factory
 * @name LabelTree
 * @memberOf dias.api
 * @description Provides the resource for label trees.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all public label trees
var labelTrees = LabelTree.query(function () {
   console.log(labelTrees); // [{id: 1, name: "Test Label Tree", ...}, ...]
});

// create a new label tree
var labelTree = LabelTree.create({name: "My Label Tree", visibility_id: 1, description: "tree"},
   function () {
      console.log(labelTree); // {id: 2, name: "My Label Tree", ...}
   }
);

// update a label tree
LabelTree.update({id: 1, name: 'New Label Tree'});

// delete a labelTree
LabelTree.delete({id: 1});
 *
 */
angular.module('dias.api').factory('LabelTree', function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/label-trees/:id', {id: '@id'}, {
		// a user can only query their own label-trees
		query: { method: 'GET', isArray: true },
		create: { method: 'POST' },
		update: { method: 'PUT' }
	});
});
