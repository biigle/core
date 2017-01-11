/**
 * @namespace biigle.transects
 * @ngdoc controller
 * @name AnnotationsLabelFilterController
 * @memberOf biigle.transects
 * @description Manages the annotation label filter feature
 */
angular.module('biigle.transects').controller('AnnotationsLabelFilterController', function (AnnotationLabelImage, filter, TRANSECT_ID) {
        "use strict";

        filter.add({
            name: 'annotation with label',
            helpText: 'All images that contain one or more annotations with the given label.',
            helpTextNegate: 'All images that contain no annotations with the given label.',
            template: 'annotationWithLabelFilterRule.html',
            typeahead: 'annotationLabelFilterTypeahead.html',
            getSequence: function (label) {
                return AnnotationLabelImage.query({transect_id: TRANSECT_ID, data: label.id});
            }
        });
    }
);
