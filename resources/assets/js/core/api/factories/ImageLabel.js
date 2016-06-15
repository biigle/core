/**
 * @ngdoc factory
 * @name ImageLabel
 * @memberOf dias.api
 * @description Provides the resource for image labels.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all labels of an image
var labels = ImageLabel.query({image_id: 1}, function () {
   console.log(labels); // [{id: 1, label: {...}, ...}, ...]
});

// attach a new label to an image
var label = ImageLabel.attach({label_id: 1, image_id: 1}, function () {
   console.log(label); // {id: 1, name: 'my label', user_id: 1, ...}
});

// detach a label
var labels = ImageLabel.query({image_id: 1}, function () {
   var label = labels[0];
   label.$delete();
});
// or directly
ImageLabel.delete({id: 1});
 *
 */
angular.module('dias.api').factory('ImageLabel', function ($resource, URL) {
	"use strict";

	return $resource(URL + '/api/v1/image-labels/:id', {
			id: '@id',
			image_id: '@image_id'
		}, {
			query: {
				method: 'GET',
                url: URL + '/api/v1/images/:image_id/labels',
				isArray: true
			},
			attach: {
				method: 'POST',
				url: URL + '/api/v1/images/:image_id/labels',
			},
            delete: {
                method: 'DELETE',
                params: {image_id: null}
            }
	});
});
