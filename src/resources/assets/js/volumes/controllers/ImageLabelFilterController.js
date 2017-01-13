/**
 * @namespace biigle.volumes
 * @ngdoc controller
 * @name ImageLabelFilterController
 * @memberOf biigle.volumes
 * @description Manages the image label filter feature
 */
angular.module('biigle.volumes').controller('ImageLabelFilterController', function (ImageLabelImage, filter, VOLUME_ID) {
        "use strict";

        filter.add({
            name: 'image label',
            helpText: 'All images that have the given image label attached.',
            helpTextNegate: 'All images that don\'t have the given image label attached.',
            template: 'imageWithLabelFilterRule.html',
            typeahead: 'imageLabelFilterTypeahead.html',
            getSequence: function (label) {
                return ImageLabelImage.query({volume_id: VOLUME_ID, data: label.id});
            }
        });
    }
);
