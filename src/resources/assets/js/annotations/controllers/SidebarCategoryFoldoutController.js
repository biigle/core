/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name SidebarCategoryFoldoutController
 * @memberOf dias.annotations
 * @description Controller for the sidebar category foldout button
 */
angular.module('dias.annotations').controller('SidebarCategoryFoldoutController', function ($scope, keyboard) {
		"use strict";

        keyboard.on(9, function (e) {
            e.preventDefault();
            $scope.toggleFoldout('categories');
            $scope.$apply();
        });
	}
);
