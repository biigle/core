/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name HasImageLabelFilterController
 * @memberOf dias.transects
 * @description Manages the image labels filter feature
 */
angular.module('dias.transects').controller('HasImageLabelFilterController', function (LabelImage, filter) {
        "use strict";

        filter.add({
            name: 'image labels',
            helpText: 'All images that have one or more image labels attached.',
            helpTextNegate: 'All images that have no image labels attached.',
            template: 'hasImageLabelsFilterRule.html',
            resource: LabelImage,
            typeahead: null,
            transformData: function () {
                return null;
            }
        });
    }
);
