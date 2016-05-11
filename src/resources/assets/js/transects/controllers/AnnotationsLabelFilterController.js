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
            name: 'label',
            resource: AnnotationLabelImage,
            typeahead: 'labelFilterTypeahead.html',
            transformData: function (label) {
                return label.id;
            }
        });
    }
);
