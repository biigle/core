/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name AnnotationsLabelFilterController
 * @memberOf dias.transects
 * @description Manages the label filter feature
 */
angular.module('dias.transects').controller('AnnotationsLabelFilterController', function (AnnotationLabelImage, filter) {
        "use strict";

        filter.add({
            name: 'annotation with label',
            template: 'annotationWithLabelFilterRule.html',
            resource: AnnotationLabelImage,
            typeahead: 'annotationLabelFilterTypeahead.html',
            transformData: function (label) {
                return label.id;
            }
        });
    }
);
