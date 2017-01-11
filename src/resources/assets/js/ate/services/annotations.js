/**
 * @namespace biigle.ate
 * @ngdoc service
 * @name annotations
 * @memberOf biigle.ate
 * @description Service for managing the dismissed/replaced annotation labels of the ATE view
 */
angular.module('biigle.ate').service('annotations', function (TRANSECT_IMAGES, ate, labels, images, msg) {
        "use strict";

        // cache that maps label IDs to IDs of annotations with this label
        var labelMapCache = {};

        var annotationsExist = false;

        var loading = false;
        var saving = false;

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
        var annotationCountElement = document.getElementById('annotation-count');

        var updateAnnotationCount = function (count) {
            count = count || TRANSECT_IMAGES.length;
            annotationCountElement.innerHTML = count;
        };

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

        var handleFetchAnnotationsError = function (response) {
            loading = false;
            msg.responseError(response);
        };

        var handleSaveSuccess = function () {
            saving = false;
            labelMapCache = {};
            dismissed = {};
            dismissedFlat.length = 0;
            changed = {};
        };

        var handleSaveError = function (response) {
            saving = false;
            switchToDismissedAnnotations();
            msg.responseError(response);
        };

        var updateDisplayedAnnotations = function (ids) {
            loading = false;
            annotationsExist = ids.length > 0;
            if (annotationsExist) {
                Array.prototype.push.apply(TRANSECT_IMAGES, ids);
            }
            images.updateFiltering();
            updateAnnotationCount();
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
            updateDisplayedAnnotations(dismissedFlat);
            images.scrollToPercent(0);
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

        // return the label that was assigned to an annotation in the re-label step
        this.getChangedLabel = function (annotationId) {
            if (changed.hasOwnProperty(annotationId)) {
                return labels.getLabel(changed[annotationId]);
            }

            return null;
        };

        this.handleSelectedLabel = function (label) {
            if (!label || step === STEP.RELABEL) {
                return;
            }

            var id = label.id;
            TRANSECT_IMAGES.length = 0;
            updateAnnotationCount();
            images.updateFiltering();
            images.scrollToPercent(0);

            if (labelMapCache.hasOwnProperty(id)) {
                updateDisplayedAnnotations(labelMapCache[id]);
            } else {
                loading = true;
                labelMapCache[id] = ate.getAnnotations(id);
                labelMapCache[id].$promise.then(
                    updateDisplayedAnnotations,
                    handleFetchAnnotationsError
                );
            }
        };

        this.exist = function () {
            return annotationsExist;
        };

        this.isLoading = function () {
            return loading;
        };

        this.isSaving = function () {
            return saving;
        };

        this.canContinue = function () {
            return dismissedFlat.length > 0;
        };

        this.goToStep = function (s) {
            step = s;
            if (step === STEP.DISMISS) {
                _this.handleSelectedLabel(labels.getSelectedLabel());
            } else {
                switchToDismissedAnnotations();
            }
        };

        this.save = function () {
            saving = true;
            TRANSECT_IMAGES.length = 0;
            updateAnnotationCount();
            images.updateFiltering();
            var promise = ate.save(dismissed, changed).$promise;
            promise.then(handleSaveSuccess, handleSaveError);

            return promise;
        };
    }
);
