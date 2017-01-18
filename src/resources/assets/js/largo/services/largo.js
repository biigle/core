/**
 * @namespace biigle.largo
 * @ngdoc service
 * @name largo
 * @memberOf biigle.largo
 * @description Manages the interaction with the Largo specific API endpoints
 */
angular.module('biigle.largo').service('largo', function (LARGO_VOLUME_ID, VolumeFilterAnnotationLabel, Largo) {
        "use strict";

        this.getAnnotations = function (label_id) {
            return VolumeFilterAnnotationLabel.query({
                volume_id: LARGO_VOLUME_ID,
                label_id: label_id
            });
        };

        this.save = function (dismissed, changed) {
            return Largo.save(
                {volume_id: LARGO_VOLUME_ID},
                {dismissed: dismissed, changed: changed}
            );
        };
    }
);
