/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name labels
 * @memberOf dias.annotations
 * @description Wrapper service for annotation labels to provide some convenience functions.
 */
angular.module('dias.annotations').service('labels', function (AnnotationLabel) {
		"use strict";

		this.fetchForAnnotation = function (annotation) {
			// don't fetch twice
			if (!annotation.labels) {
				annotation.labels = AnnotationLabel.query({
						annotation_id: annotation.id
				});
			}

			return annotation.labels;
		};
	}
);