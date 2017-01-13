/**
 * @namespace biigle.ate
 * @ngdoc service
 * @name ate
 * @memberOf biigle.ate
 * @description Manages the interaction with the Ate specific API endpoints
 */
angular.module('biigle.ate').service('ate', function (ATE_VOLUME_ID, VolumeFilterAnnotationLabel, Ate) {
        "use strict";

        this.getAnnotations = function (label_id) {
            return VolumeFilterAnnotationLabel.query({
                volume_id: ATE_VOLUME_ID,
                label_id: label_id
            });
        };

        this.save = function (dismissed, changed) {
            return Ate.save(
                {volume_id: ATE_VOLUME_ID},
                {dismissed: dismissed, changed: changed}
            );
        };
    }
);
