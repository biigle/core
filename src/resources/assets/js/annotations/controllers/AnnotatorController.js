/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name AnnotatorController
 * @memberOf dias.annotations
 * @description Main controller of the Annotator application.
 */
angular.module('dias.annotations').controller('AnnotatorController', function ($scope, $element, $attrs, images) {
		"use strict";

		$scope.images = images;
		images.init($attrs.transectId);
		images.show(parseInt($attrs.imageId));
	}
);