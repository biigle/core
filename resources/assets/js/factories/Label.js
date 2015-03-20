/**
 * @ngdoc factory
 * @name Label
 * @memberOf dias.core
 * @description Provides the resource for labels.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all labels
var labels = Label.query(function () {
   console.log(labels); // [{id: 1, name: "Benthic Object", ...}, ...]
});

// get one label
var label = Label.get({id: 1}, function () {
   console.log(label); // {id: 1, name: "Benthic Object", ...}
});

// create a new label
var label = Label.add({name: "Trash", parent_id: 1}, function () {
   console.log(label); // {id: 2, name: "Trash", parent_id: 1, ...}
});

// update a label
var label = Label.get({id: 1}, function () {
   label.name = 'Trash';
   label.$save();
});
// or directly
Label.save({id: 1, name: 'Trash'});

// delete a label
var label = Label.get({id: 1}, function () {
   label.$delete();
});
// or directly
Label.delete({id: 1});
 *
 */
angular.module('dias.core').factory('Label', function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/labels/:id', { id: '@id' },
		{
			add: {method: 'POST' },
			save: { method: 'PUT' }
		}
	);
});