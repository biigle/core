/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name DrawingControlsController
 * @memberOf dias.annotations
 * @description Controller for the controls bar drawing butons
 */
angular.module('dias.annotations').controller('DrawingControlsController', function ($scope, mapAnnotations, labels, msg, $attrs, keyboard, mapInteractions) {
		"use strict";

        var selectedShape;

		$scope.selectShape = function (name) {
            if (name === null || $scope.isSelected(name)) {
                mapAnnotations.finishDrawing();
                selectedShape = undefined;
            } else {
                if (!labels.hasSelected()) {
                    $scope.$emit('sidebar.foldout.do-open', 'categories');
                    msg.info($attrs.selectCategory);
                    return;
                }
                mapAnnotations.startDrawing(name);
                selectedShape = name;
            }
		};

        $scope.isSelected = function (name) {
            return mapInteractions.active('draw') && selectedShape === name;
        };

        // deselect drawing tool on escape
        keyboard.on(27, function () {
            $scope.selectShape(null);
            $scope.$apply();
        });

        keyboard.on('a', function () {
            $scope.selectShape('Point');
            $scope.$apply();
        });

        keyboard.on('s', function () {
            $scope.selectShape('Rectangle');
            $scope.$apply();
        });

        keyboard.on('d', function () {
            $scope.selectShape('Circle');
            $scope.$apply();
        });

        keyboard.on('f', function () {
            $scope.selectShape('LineString');
            $scope.$apply();
        });

        keyboard.on('g', function () {
            $scope.selectShape('Polygon');
            $scope.$apply();
        });
	}
);
