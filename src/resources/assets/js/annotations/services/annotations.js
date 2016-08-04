/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name annotations
 * @memberOf dias.annotations
 * @description Wrapper service the annotations to make them available in multiple controllers.
 */
angular.module('dias.annotations').service('annotations', function (Annotation, shapes, msg, AnnotationLabel, labels) {
		"use strict";

        var _this = this;
		var annotations;
        var promise;

        var observers = [];

        /*
         * Contains one item for each label that is present in annotations on the image
         * (with label IDs as keys).
         * Each item is an object {label:..., annotations:...}, the label this item
         * represents and a list of all annotations that are associated with the label.
         * The annotation items are not the annotation objects themselves but
         * {label:..., annotation:..., shape:...} objects with a reference to the user
         * that attached the label to the annotation.
         */
        var groupedByLabel = {};

        var filtered = {
            groupedByLabel: {},
            flat: []
        };

        // Array of active filter functions.
        var activeFilters = [];

        // All labels belonging to the currently displayed annotations.
        var availableLabels = [];
        // All users belonging to the currently displayed annotations.
        var availableUsers = [];

        // maps image IDs to the array of annotations for all images that were already
        // visited
        var cache = {};

        // execute a callback on the first element of a list having a certain id
        var doForId = function (list, id, callback) {
            for (var i = list.length - 1; i >= 0; i--) {
                if (list[i].id === id) {
                    return callback(list[i], i);
                }
            }
        };

		var resolveShapeName = function (annotation) {
			annotation.shape = shapes.getName(annotation.shape_id);
			return annotation;
		};

		var addAnnotation = function (annotation) {
			annotations.push(annotation);
            insertIntoGroupedByLabel(annotation, annotation.labels[0]);
			return annotation;
		};

        var removeAnnotation = function (annotation) {
            var index = annotations.indexOf(annotation);
            annotations.splice(index, 1);
            removeAnnotationFromGroupedByLabel(annotation);
            return annotation;
        };

        var insertIntoGroupedByLabel = function (annotation, annotationLabel) {
            var annotationItem = {
                annotation: annotation,
                label: annotationLabel,
                shape: annotation.shape
            };
            var label = annotationLabel.label;

            if (groupedByLabel.hasOwnProperty(label.id)) {
                groupedByLabel[label.id].annotations.push(annotationItem);
            } else {
                groupedByLabel[label.id] = {
                    label: label,
                    annotations: [annotationItem]
                };
            }
        };

        var removeFromGroupedByLabel = function (annotation, label) {
            var annotations = groupedByLabel[label.id].annotations;

            for (var i = annotations.length - 1; i >= 0; i--) {
                if (annotations[i].annotation.id === annotation.id) {
                    annotations.splice(i, 1);
                    break;
                }
            }

            if (annotations.length === 0) {
                delete groupedByLabel[label.id];
            }
        };

        var removeAnnotationFromGroupedByLabel = function (annotation) {
            for (var key in groupedByLabel) {
                if (!groupedByLabel.hasOwnProperty(key)) continue;
                removeFromGroupedByLabel(annotation, groupedByLabel[key].label);
            }
        };

        var clearGroupedByLabel = function () {
            for (var key in groupedByLabel) {
                if (!groupedByLabel.hasOwnProperty(key)) continue;
                delete groupedByLabel[key];
            }
        };

        var buildGroupedByLabel = function (anns) {
            var annotation;
            var labels;

            for (var i = anns.length - 1; i >= 0; i--) {
                annotation = anns[i];
                labels = annotation.labels;

                for (var j = labels.length - 1; j >= 0; j--) {
                    insertIntoGroupedByLabel(annotation, labels[j]);
                }
            }
        };

        var refreshFiltering = function (silent) {
            var f = {
                groupedByLabel: angular.copy(groupedByLabel),
                flat: angular.copy(annotations)
            };

            for (var i = activeFilters.length - 1; i >= 0; i--) {
                f = activeFilters[i](f);
            }

            filtered.groupedByLabel = f.groupedByLabel;
            filtered.flat = f.flat;

            if (!silent) {
                observers.forEach(function (callback) {
                    callback(filtered.flat);
                });
            }
        };

        var refreshAvailableLabels = function () {
            availableLabels.length = 0;
            for (var id in groupedByLabel) {
                if (groupedByLabel.hasOwnProperty(id)) {
                    availableLabels.push(groupedByLabel[id].label);
                }
            }
        };

        var refreshAvailableUsers = function () {
            availableUsers.length = 0;
            var ids = {};

            annotations.forEach(function (annotation) {
                annotation.labels.forEach(function (annotationLabel) {
                    if (!ids.hasOwnProperty(annotationLabel.user.id)) {
                        ids[annotationLabel.user.id] = 1;
                        availableUsers.push(annotationLabel.user);
                    }
                });
            });
        };

        var update = function (silent) {
            refreshAvailableUsers();
            refreshAvailableLabels();
            refreshFiltering(silent === true);
        };

		this.get = function () {
            return filtered.flat;
		};

        this.getGroupedByLabel = function () {
            return filtered.groupedByLabel;
        };

        this.load = function (id) {
            clearGroupedByLabel();

            if (cache.hasOwnProperty(id)) {
                annotations = cache[id];
            } else {
                annotations = Annotation.query({id: id});
                cache[id] = annotations;
                annotations.$promise.then(function (a) {
                    a.forEach(resolveShapeName);
                });
            }

            // update *after* clearing annotations and groupByLabel
            update();

            promise = annotations.$promise
                .then(buildGroupedByLabel)
                .then(update)
                .then(_this.get);
        };

        this.add = function (params) {
            if (!params.shape_id && params.shape) {
                params.shape_id = shapes.getId(params.shape);
            }
            var annotation = Annotation.add(params);
            annotation.$promise
                .catch(msg.responseError)
                .then(resolveShapeName)
                .then(addAnnotation)
                .then(update);

            return annotation;
        };

        this.delete = function (annotation) {
            return doForId(annotations, annotation.id, function (a) {
                return a.$delete()
                    .catch(msg.responseError)
                    .then(removeAnnotation)
                    .then(update);
            });
        };

        this.getPromise = function () {
            return promise;
        };

        this.attachAnnotationLabel = function (annotation, label, confidence) {
            label = label || labels.getSelected();
            confidence = confidence || labels.getCurrentConfidence();

            var annotationLabel = AnnotationLabel.attach({
                annotation_id: annotation.id,
                label_id: label.id,
                confidence: confidence
            }, function () {
                doForId(annotations, annotation.id, function (a) {
                    a.labels.push(annotationLabel);
                    insertIntoGroupedByLabel(a, annotationLabel);
                    update(true);
                });
            }, msg.responseError);

            return annotationLabel;
        };

        this.removeAnnotationLabel = function (annotation, label) {
            return AnnotationLabel.delete({id: label.id}, function () {
                doForId(annotations, annotation.id, function (a) {
                    doForId(a.labels, label.id, function (l, index) {
                        a.labels.splice(index, 1);
                    });
                    removeFromGroupedByLabel(a, label.label);
                    update();
                });
            }, msg.responseError);
        };

        this.setFilter = function (filter) {
            _this.clearActiveFilters();
            activeFilters.push(filter);
        };

        this.refreshFiltering = refreshFiltering;

        this.clearActiveFilters = function () {
            activeFilters.length = 0;
        };

        this.hasActiveFilters = function () {
            return activeFilters.length > 0;
        };

        this.getAvailableLabels = function () {
            return availableLabels;
        };

        this.getAvailableUsers = function () {
            return availableUsers;
        };

        this.getAvailableShapes = shapes.getAll;

        this.observe = function (callback) {
            observers.push(callback);
        };

        this.unobserve = function (callback) {
            var index = observers.indexOf(callback);
            if (index !== -1) {
                observers.splice(index, 1);
            }
        };
	}
);
