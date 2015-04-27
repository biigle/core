/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name annotations
 * @memberOf dias.annotations
 * @description Wrapper service the annotations to make them available in multiple controllers.
 */
angular.module('dias.annotations').service('annotations', function (Annotation, shapes) {
		"use strict";

		var annotations;

		var resolveShapeName = function (annotation) {
			annotation.shape = shapes.getName(annotation.shape_id);
		};

		this.query = function (params) {
			annotations = Annotation.query(params);
			annotations.$promise.then(function (a) {
				a.forEach(resolveShapeName);
			});
			return annotations;
		};

		this.add = function (params) {
			if (!params.shape_id && params.shape) {
				params.shape_id = shapes.getId(params.shape);
			}
			var annotation = Annotation.add(params);
			annotation.$promise.then(resolveShapeName);
			annotations.push(annotation);
			return annotation;
		};

		this.delete = function (annotation) {
			var index = annotations.indexOf(annotation);
			if (index > -1) {
				annotations.splice(index, 1);
				return annotation.$delete();
			}
		};

		this.forEach = function (fn) {
			return annotations.forEach(fn);
		};

		this.current = function () {
			return annotations;
		};
	}
);