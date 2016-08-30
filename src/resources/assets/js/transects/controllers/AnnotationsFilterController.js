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
            helpText: 'All images that contain one or more annotations.',
            helpTextNegate: 'All images that contain no annotations.',
            template: 'annotationsFilterRule.html',
            resource: AnnotationImage,
            typeahead: null,
            transformData: function () {
                return null;
            }
        });
    }
);
