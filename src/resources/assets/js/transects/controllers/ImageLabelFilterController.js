/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name ImageLabelFilterController
 * @memberOf dias.transects
 * @description Manages the image label filter feature
 */
angular.module('dias.transects').controller('ImageLabelFilterController', function (ImageLabelImage, filter, TRANSECT_ID) {
        "use strict";

        filter.add({
            name: 'image label',
            helpText: 'All images that have the given image label attached.',
            helpTextNegate: 'All images that don\'t have the given image label attached.',
            template: 'imageWithLabelFilterRule.html',
            typeahead: 'imageLabelFilterTypeahead.html',
            getSequence: function (label) {
                return ImageLabelImage.query({transect_id: TRANSECT_ID, data: label.id});
            }
        });
    }
);
