/**
 * @ngdoc factory
 * @name AnnotationLabel
 * @memberOf biigle.api
 * @description Provides the resource for annotation labels.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// get all labels of an annotation and update one of them
var labels = AnnotationLabel.query({annotation_id: 1}, function () {
   var label = labels[0];
   label.confidence = 0.9;
   label.$save();
});

// directly update a label
AnnotationLabel.save({confidence: 0.1, annotation_id: 1, id: 1});

// attach a new label to an annotation
var label = AnnotationLabel.attach({label_id: 1, confidence: 0.5, annotation_id: 1}, function () {
   console.log(label); // {id: 1, name: 'my label', user_id: 1, ...}
});


// detach a label
var labels = AnnotationLabel.query({annotation_id: 1}, function () {
   var label = labels[0];
   label.$delete();
});
// or directly
AnnotationLabel.delete({id: 1});
 *
 */
angular.module('biigle.api').factory('AnnotationLabel', function ($resource, URL) {
   "use strict";

   return $resource(URL + '/api/v1/annotation-labels/:id', {
         id: '@id',
         annotation_id: '@annotation_id'
      }, {
         query: {
            method: 'GET',
                url: URL + '/api/v1/annotations/:annotation_id/labels',
            isArray: true
         },
         attach: {
            method: 'POST',
            url: URL + '/api/v1/annotations/:annotation_id/labels',
         },
         save: {
            method: 'PUT',
                params: {annotation_id: null}
         },
            delete: {
                method: 'DELETE',
                params: {annotation_id: null}
            }
   });
});
