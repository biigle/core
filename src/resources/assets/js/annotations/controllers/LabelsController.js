/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name LabelsController
 * @memberOf dias.annotations
 * @description Controller for the labels list in the sidebar
 */
angular.module('dias.annotations').controller('LabelsController', function ($scope, mapAnnotations, labels) {
		"use strict";

		$scope.selectedFeatures = mapAnnotations.getSelectedFeatures().getArray();

		$scope.$watchCollection('selectedFeatures', function (features) {
			features.forEach(function (feature) {
				labels.fetchForAnnotation(feature.annotation);
			});
		});
	}
);