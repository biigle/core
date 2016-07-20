/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name annotations
 * @memberOf dias.annotations
 * @description Wrapper service the annotations to make them available in multiple controllers.
 */
angular.module('dias.annotations').service('annotations', function (Annotation, shapes, msg, AnnotationLabel, labels) {
		"use strict";

		var annotations;
        var promise;

        /*
         * Contains one item for each label that is present in annotations on the image
         * (with label IDs as keys).
         * Each item is an object {label:..., annotations:...}, the label this item
         * represents and a list of all annotations that are associated with the label.
         * The annotation items are not the annotation objects themselbes but
         * {user:..., annotation:..., shape:...} objects with a reference to the user
         * that attached the label to the annotation.
         */
        var groupedByLabel = {};

        // maps image IDs to the array of annotations for all images that were already
        // visited
        var cache = {};

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

		this.query = function (params) {
            clearGroupedByLabel();
            if (cache.hasOwnProperty(params.id)) {
                annotations = cache[params.id];
            } else {
                annotations = Annotation.query(params);
                cache[params.id] = annotations;
                annotations.$promise.then(function (a) {
                    a.forEach(resolveShapeName);
                });
            }

            promise = annotations.$promise;
            promise.then(buildGroupedByLabel);

			return annotations;
		};

		this.add = function (params) {
			if (!params.shape_id && params.shape) {
				params.shape_id = shapes.getId(params.shape);
			}
			var annotation = Annotation.add(params);
			annotation.$promise
			          .then(resolveShapeName)
			          .then(addAnnotation)
			          .catch(msg.responseError);

			return annotation;
		};

		this.delete = function (annotation) {
			if (annotations.indexOf(annotation) > -1) {
				return annotation.$delete(removeAnnotation, msg.responseError);
			}
		};

		this.forEach = function (fn) {
			return annotations.forEach(fn);
		};

		this.current = function () {
			return annotations;
		};

        this.getPromise = function () {
            return promise;
        };

        this.getGroupedByLabel = function () {
            return groupedByLabel;
        };

        this.attachAnnotationLabel = function (annotation, label, confidence) {
            label = label || labels.getSelected();
            confidence = confidence || labels.getCurrentConfidence();

            var annotationLabel = AnnotationLabel.attach({
                annotation_id: annotation.id,
                label_id: label.id,
                confidence: confidence
            }, function () {
                annotation.labels.push(annotationLabel);
                insertIntoGroupedByLabel(annotation, annotationLabel);
            }, msg.responseError);

            return annotationLabel;
        };

        this.removeAnnotationLabel = function (annotation, label) {
            return AnnotationLabel.delete({id: label.id}, function () {
                var index = annotation.labels.indexOf(label);
                annotation.labels.splice(index, 1);
                removeFromGroupedByLabel(annotation, label.label);
            }, msg.responseError);
        };
	}
);
