/**
 * @namespace biigle.volumes
 * @ngdoc controller
 * @name AnnotationsLabelFilterController
 * @memberOf biigle.volumes
 * @description Manages the annotation label filter feature
 */
angular.module('biigle.volumes').controller('AnnotationsLabelFilterController', function (AnnotationLabelImage, filter, VOLUME_ID) {
        "use strict";

        filter.add({
            name: 'annotation with label',
            helpText: 'All images that contain one or more annotations with the given label.',
            helpTextNegate: 'All images that contain no annotations with the given label.',
            template: 'annotationWithLabelFilterRule.html',
            typeahead: 'annotationLabelFilterTypeahead.html',
            getSequence: function (label) {
                return AnnotationLabelImage.query({volume_id: VOLUME_ID, data: label.id});
            }
        });
    }
);
