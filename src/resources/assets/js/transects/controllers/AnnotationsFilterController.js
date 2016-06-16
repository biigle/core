/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name AnnotationsFilterController
 * @memberOf dias.transects
 * @description Manages the annotation filter feature
 */
angular.module('dias.transects').controller('AnnotationsFilterController', function ( AnnotationImage, filter) {
        "use strict";

        filter.add({
            name: 'annotations',
            template: 'annotationsFilterRule.html',
            resource: AnnotationImage,
            typeahead: null
        });
    }
);
