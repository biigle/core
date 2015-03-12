/**
 * @ngdoc factory
 * @name Shape
 * @memberOf dias.core
 * @description Provides the resource for shapes.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all shapes
var shapes = Shape.query(function () {
   console.log(shapes); // [{id: 1, name: "point"}, ...]
});

// get one media type
var shape = Shape.get({id: 1}, function () {
   console.log(shape); // {id: 1, name: "point"}
});
 *
 */
angular.module('dias.core').factory('Shape', function ($resource) {
	"use strict";

	return $resource('/api/v1/shapes/:id', { id: '@id' });
});