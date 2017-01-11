/**
 * @ngdoc factory
 * @name Label
 * @memberOf biigle.api
 * @description Provides the resource for labels.
 * @requires $resource
 * @returns {Object} A new [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource) object
 * @example
// create a new label
var labels = Label.create({label_tree_id: 1, name: "Trash", color: 'bada55'}, function () {
   console.log(labels); // [{id: 2, name: "Trash", color: 'bada55', ...}]
});

// delete a label
Label.delete({id: 1});
 *
 */
angular.module('biigle.api').factory('Label', function ($resource, URL) {
    "use strict";

    return $resource(URL + '/api/v1/labels/:id', { id: '@id' },
        {
            create: {
              method: 'POST',
              url: URL + '/api/v1/label-trees/:label_tree_id/labels',
              params: { label_tree_id: '@label_tree_id' },
              isArray: true
            }
        }
    );
});
