/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name DrawingControlsController
 * @memberOf dias.annotations
 * @description Controller for the controls bar drawing butons
 */
angular.module('dias.annotations').controller('DrawingControlsController', function ($scope, mapAnnotations, labels, msg, $attrs, keyboard) {
		"use strict";

		$scope.selectShape = function (name) {
			if (!labels.hasSelected()) {
                $scope.$emit('sidebar.foldout.do-open', 'categories');
				msg.info($attrs.selectCategory);
				return;
			}

            if (name !== null && $scope.selectedShape() !== name) {
				mapAnnotations.startDrawing(name);
			} else {
                mapAnnotations.finishDrawing();
            }
		};

        $scope.selectedShape = mapAnnotations.getSelectedDrawingType;

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
