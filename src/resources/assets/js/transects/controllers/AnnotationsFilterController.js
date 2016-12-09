/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name AnnotationsFilterController
 * @memberOf dias.transects
 * @description Manages the annotation filter feature
 */
angular.module('dias.transects').controller('AnnotationsFilterController', function ( AnnotationImage, filter, TRANSECT_ID) {
        "use strict";

        filter.add({
            name: 'annotations',
            helpText: 'All images that contain one or more annotations.',
            helpTextNegate: 'All images that contain no annotations.',
            template: 'annotationsFilterRule.html',
            getSequence: function () {
                return AnnotationImage.query({transect_id: TRANSECT_ID});
            }
        });
    }
);
