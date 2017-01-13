/**
 * @namespace biigle.annotations
 * @ngdoc service
 * @name exampleAnnotations
 * @memberOf biigle.annotations
 * @description Service to manage example annotation images
 */
angular.module('biigle.annotations').service('exampleAnnotations', function (VolumeFilterAnnotationLabel, VOLUME_ID) {
        "use strict";

        // number of annotations to display
        var TAKE = 3;

        // map of label ID to list of already fetched annotation IDs
        var cache = {};
        var enabled = true;

        this.getForLabel = function (label) {
            if (!label) {
                return [];
            }

            // fetch anew as long as there are not enough sample annotations available
            if (!cache.hasOwnProperty(label.id) || cache[label.id].length < TAKE) {
                cache[label.id] = VolumeFilterAnnotationLabel.query({
                    volume_id: VOLUME_ID,
                    label_id: label.id,
                    take: TAKE
                });
            }

            return cache[label.id];
        };

        this.disable = function () {
            enabled = false;
        };

        this.enable = function () {
            enabled = true;
        };

        this.isEnabled = function () {
            return enabled;
        };
    }
);
