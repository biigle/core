/**
 * @namespace biigle.volumes
 * @ngdoc controller
 * @name HasImageLabelFilterController
 * @memberOf biigle.volumes
 * @description Manages the image labels filter feature
 */
angular.module('biigle.volumes').controller('HasImageLabelFilterController', function (LabelImage, filter, VOLUME_ID) {
        "use strict";

        filter.add({
            name: 'image labels',
            helpText: 'All images that have one or more image labels attached.',
            helpTextNegate: 'All images that have no image labels attached.',
            template: 'hasImageLabelsFilterRule.html',
            getSequence: function () {
                return LabelImage.query({volume_id: VOLUME_ID});
            }
        });
    }
);
