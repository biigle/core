/**
 * @namespace biigle.volumes
 * @ngdoc controller
 * @name AnnotationsFilterController
 * @memberOf biigle.volumes
 * @description Manages the annotation filter feature
 */
angular.module('biigle.volumes').controller('AnnotationsFilterController', function ( AnnotationImage, filter, VOLUME_ID) {
        "use strict";

        filter.add({
            name: 'annotations',
            helpText: 'All images that contain one or more annotations.',
            helpTextNegate: 'All images that contain no annotations.',
            template: 'annotationsFilterRule.html',
            getSequence: function () {
                return AnnotationImage.query({volume_id: VOLUME_ID});
            }
        });
    }
);
