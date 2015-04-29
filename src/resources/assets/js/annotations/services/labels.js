/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name labels
 * @memberOf dias.annotations
 * @description Wrapper service for annotation labels to provide some convenience functions.
 */
angular.module('dias.annotations').service('labels', function (AnnotationLabel, Label) {
		"use strict";

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
	}
);