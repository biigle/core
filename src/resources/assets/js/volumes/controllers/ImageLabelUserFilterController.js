/**
 * @namespace biigle.volumes
 * @ngdoc controller
 * @name ImageLabelUserFilterController
 * @memberOf biigle.volumes
 * @description Manages the image label user filter feature
 */
angular.module('biigle.volumes').controller('ImageLabelUserFilterController', function (  ImageLabelUserImage, filter, VOLUME_ID) {
        "use strict";

        filter.add({
            name: 'image label by user',
            helpText: 'All images that have one or more image labels attached by the given user.',
            helpTextNegate: 'All images that don\'t have image labels attached by the given user.',
            template: 'imageLabelByUserFilterRule.html',
            typeahead: 'imageLabelUserFilterTypeahead.html',
            getSequence: function (user) {
                return ImageLabelUserImage.query({volume_id: VOLUME_ID, data: user.id});
            },
        });
    }
);
