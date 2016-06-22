/**
 * @namespace dias.ate
 * @ngdoc service
 * @name annotationLabels
 * @memberOf dias.ate
 * @description Service for managing the dismissed/replaced annotation labels of the ATE view
 */
angular.module('dias.ate').service('annotationLabels', function (labels) {
        "use strict";

        // maps label IDs to the IDs of dismissed annotations for the label
        var dismissed = {};
        // array of unique IDs of dismissed annotations
        // (they may occur multiple times in the 'dismissed' map)
        var dismissedFlat = [];

        var addToDismissedFlat = function (id) {
            if (dismissedFlat.indexOf(id) === -1) {
                dismissedFlat.push(id);
            }
        };

        var removeFromDismissedFlat = function (id) {
            var index = dismissedFlat.indexOf(id);
            if (index !== -1) {
                dismissedFlat.splice(index, 1);
            }
        };

        this.toggleDismiss = function (annotationId) {
            var labelId = labels.getSelectedLabel().id;
            if (dismissed.hasOwnProperty(labelId)) {
                var index = dismissed[labelId].indexOf(annotationId);
                if (index !== -1) {
                    // if annotation already was dismissed, revert
                    dismissed[labelId].splice(index, 1);
                    removeFromDismissedFlat(annotationId);
                } else {
                    // if annotation wasn't dismissed, dismiss
                    dismissed[labelId].push(annotationId);
                    addToDismissedFlat(annotationId);
                }
            } else {
                // if property didn't exist, the annotation wasn't already dismissed
                dismissed[labelId] = [annotationId];
                addToDismissedFlat(annotationId);
            }
        };

        // checks if the annotation was dismissed *for the currently selected label*
        this.isDismissed = function (annotationId) {
            var labelId = labels.getSelectedLabel().id;
            return dismissed.hasOwnProperty(labelId) &&
                dismissed[labelId].indexOf(annotationId) !== -1;
        };

        this.getDismissedIds = function () {
            return dismissedFlat;
        };
    }
);
