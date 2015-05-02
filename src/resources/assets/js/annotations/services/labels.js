/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name labels
 * @memberOf dias.annotations
 * @description Wrapper service for annotation labels to provide some convenience functions.
 */
angular.module('dias.annotations').service('labels', function (AnnotationLabel, Label, msg) {
		"use strict";

		var selectedLabel;
		var currentConfidence = 0.5;

		this.fetchForAnnotation = function (annotation) {
			if (!annotation) return;

			// don't fetch twice
			if (!annotation.labels) {
				annotation.labels = AnnotationLabel.query({
						annotation_id: annotation.id
				});
			}

			return annotation.labels;
		};

		this.attachToAnnotation = function (annotation) {
			var label = AnnotationLabel.attach({
				annotation_id: annotation.id,
				label_id: selectedLabel.id,
				confidence: currentConfidence
			});

			label.$promise.then(function () {
				annotation.labels.push(label);
			});

			label.$promise.catch(msg.responseError);

			return label;
		};

		this.removeFromAnnotation = function (annotation, label) {
			var index = annotation.labels.indexOf(label);
			if (index > -1) {
				return label.$delete(function () {
					annotation.labels.splice(index, 1);
				}, msg.responseError);
			}
		};

		this.getTree = function () {
			var tree = {};
			var build = function (label) {
				var parent = label.parent_id;
				if (tree[parent]) {
					tree[parent].push(label);
				} else {
					tree[parent] = [label];
				}
			};

			Label.query(function (labels) {
				labels.forEach(build);
			});

			return tree;
		};

		this.setSelected = function (label) {
			selectedLabel = label;
		};

		this.getSelected = function () {
			return selectedLabel;
		};

		this.hasSelected = function () {
			return !!selectedLabel;
		};

		this.setCurrentConfidence = function (confidence) {
			currentConfidence = confidence;
		};

		this.getCurrentConfidence = function () {
			return currentConfidence;
		};
	}
);