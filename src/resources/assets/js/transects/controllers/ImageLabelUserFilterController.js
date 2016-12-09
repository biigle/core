/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name ImageLabelUserFilterController
 * @memberOf dias.transects
 * @description Manages the image label user filter feature
 */
angular.module('dias.transects').controller('ImageLabelUserFilterController', function (  ImageLabelUserImage, filter, TRANSECT_ID) {
        "use strict";

        filter.add({
            name: 'image label by user',
            helpText: 'All images that have one or more image labels attached by the given user.',
            helpTextNegate: 'All images that don\'t have image labels attached by the given user.',
            template: 'imageLabelByUserFilterRule.html',
            typeahead: 'imageLabelUserFilterTypeahead.html',
            getSequence: function (user) {
                return ImageLabelUserImage.query({transect_id: TRANSECT_ID, data: user.id});
            },
        });
    }
);
