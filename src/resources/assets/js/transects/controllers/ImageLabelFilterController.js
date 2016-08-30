/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name ImageLabelFilterController
 * @memberOf dias.transects
 * @description Manages the image label filter feature
 */
angular.module('dias.transects').controller('ImageLabelFilterController', function (ImageLabelImage, filter) {
        "use strict";

        filter.add({
            name: 'image label',
            helpText: 'All images that have the given image label attached.',
            helpTextNegate: 'All images that don\'t have the given image label attached.',
            template: 'imageWithLabelFilterRule.html',
            resource: ImageLabelImage,
            typeahead: 'imageLabelFilterTypeahead.html',
            transformData: function (label) {
                return label.id;
            }
        });
    }
);
