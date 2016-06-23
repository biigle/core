/**
 * @namespace dias.ate
 * @ngdoc service
 * @name annotations
 * @memberOf dias.ate
 * @description Service for managing the dismissed/replaced annotation labels of the ATE view
 */
angular.module('dias.ate').service('annotations', function (ATE_TRANSECT_ID, TRANSECT_IMAGES, TransectFilterAnnotationLabel, labels, images, msg) {
        "use strict";

        // cache that maps label IDs to IDs of annotations with this label
        var labelMapCache = {};

        var annotationsExist = false;

        var loading = false;

        // maps label IDs to the IDs of dismissed annotations for the label
        var dismissed = {};
        // array of unique IDs of dismissed annotations
        // (they may occur multiple times in the 'dismissed' map)
        var dismissedFlat = [];

        // maps (dismissed) annotation IDs to IDs of labels that should be attached to them
        var changed = {};

        var step = 0;
        var STEP = {
            DISMISS: 0,
            RELABEL: 1
        };

        var _this = this;

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

            // if a dismissed annotation is reverted, it should not be changed, too
            if (changed.hasOwnProperty(id)) {
                delete changed[id];
            }
        };

        var handleError = function (response) {
            loading = false;
            msg.responseError(response);
        };

        var updateDisplayedAnnotations = function (ids) {
            loading = false;
            annotationsExist = ids.length > 0;
            if (annotationsExist) {
                Array.prototype.push.apply(TRANSECT_IMAGES, ids);
            }
            images.updateFiltering();
        };

        var toggleDismissed = function (annotationId) {
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

        var toggleChanged = function (annotationId) {
            if (changed.hasOwnProperty(annotationId)) {
                delete changed[annotationId];
            } else {
                changed[annotationId] = labels.getSelectedLabel().id;
            }
        };

        var switchToDismissedAnnotations = function () {
            TRANSECT_IMAGES.length = 0;
            annotationsExist = dismissedFlat.length > 0;
            if (annotationsExist) {
                Array.prototype.push.apply(TRANSECT_IMAGES, dismissedFlat);
            }
            images.scrollToPercent(0);
            images.updateFiltering();
        };

        this.selectAnnotation = function (id) {
            if (step === STEP.DISMISS) {
                toggleDismissed(id);
            } else {
                toggleChanged(id);
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

        this.isChanged = function (annotationId) {
            return changed.hasOwnProperty(annotationId);
        };

        this.handleSelectedLabel = function (label) {
            if (!label || step === STEP.RELABEL) {
                return;
            }

            var id = label.id;
            TRANSECT_IMAGES.length = 0;
            images.updateFiltering();
            images.scrollToPercent(0);

            if (labelMapCache.hasOwnProperty(id)) {
                updateDisplayedAnnotations(labelMapCache[id]);
            } else {
                loading = true;
                labelMapCache[id] = TransectFilterAnnotationLabel.query(
                    {transect_id: ATE_TRANSECT_ID, label_id: id},
                    updateDisplayedAnnotations,
                    msg.responseError
                );
            }
        };

        this.exist = function () {
            return annotationsExist;
        };

        this.isLoading = function () {
            return loading;
        };

        this.goToStep = function (s) {
            step = s;
            if (step === STEP.DISMISS) {
                _this.handleSelectedLabel(labels.getSelectedLabel());
            } else {
                switchToDismissedAnnotations();
            }
        };
    }
);
