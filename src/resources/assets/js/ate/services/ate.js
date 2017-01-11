/**
 * @namespace biigle.ate
 * @ngdoc service
 * @name ate
 * @memberOf biigle.ate
 * @description Manages the interaction with the Ate specific API endpoints
 */
angular.module('biigle.ate').service('ate', function (ATE_TRANSECT_ID, TransectFilterAnnotationLabel, Ate) {
        "use strict";

        this.getAnnotations = function (label_id) {
            return TransectFilterAnnotationLabel.query({
                transect_id: ATE_TRANSECT_ID,
                label_id: label_id
            });
        };

        this.save = function (dismissed, changed) {
            return Ate.save(
                {transect_id: ATE_TRANSECT_ID},
                {dismissed: dismissed, changed: changed}
            );
        };
    }
);
