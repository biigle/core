/**
 * @namespace dias.annotations
 * @ngdoc directive
 * @name annotationListItem
 * @memberOf dias.annotations
 * @description An item in the "browse annotations" annotations list
 */
angular.module('dias.annotations').directive('annotationListItem', function (map, $timeout, mapImage) {
		"use strict";

		return {
			restrict: 'A',

			replace: true,

			template: '<li data-ng-click="selectAnnotation($event, annotation.id)" data-ng-class="{selected:(isSelected(annotation.id))}"><span class="annotation-thumb" id="annotation-thumb-{{annotation.id}}"></span> #{{annotation.id}} {{annotation.shape}}</li>',

			link: function (scope, element, attrs) {
				// wait for the element to be rendered
				// $timeout(function () {
				// 	var thumb = new ol.Map({
				// 		target: 'annotation-thumb-' + scope.annotation.id,
				// 		controls: [],
				// 		interactions: []
				// 	});
				// 	var view = new ol.View({
				// 		projection: mapImage.getProjection(),
				// 	});
				// });
			}
		};
	}
);
