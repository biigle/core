/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name AnnotationsLabelFilterController
 * @memberOf dias.transects
 * @description Manages the annotation label filter feature
 */
angular.module('dias.transects').controller('AnnotationsLabelFilterController', function (AnnotationLabelImage, filter) {
        "use strict";

        filter.add({
            name: 'annotation with label',
            helpText: 'All images that contain one or more annotations with the given label.',
            helpTextNegate: 'All images that contain no annotations with the given label.',
            template: 'annotationWithLabelFilterRule.html',
            resource: AnnotationLabelImage,
            typeahead: 'annotationLabelFilterTypeahead.html',
            transformData: function (label) {
                return label.id;
            }
        });
    }
);
