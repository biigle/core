/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name exampleAnnotations
 * @memberOf dias.annotations
 * @description Service to manage example annotation images
 */
angular.module('dias.annotations').service('exampleAnnotations', function (TransectFilterAnnotationLabel, TRANSECT_ID) {
        "use strict";

        // map of label ID to list of already fetched annotation IDs
        var cache = {};
        var enabled = true;

        this.getForLabel = function (label) {
            if (!label) {
                return [];
            }

            if (!cache.hasOwnProperty(label.id)) {
                cache[label.id] = TransectFilterAnnotationLabel.query({
                    transect_id: TRANSECT_ID,
                    label_id: label.id,
                    take: 3
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
