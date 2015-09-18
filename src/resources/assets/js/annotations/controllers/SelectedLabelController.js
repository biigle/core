/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name SelectedLabelController
 * @memberOf dias.annotations
 * @description Controller for the selected label display in the map
 */
angular.module('dias.annotations').controller('SelectedLabelController', function ($scope, labels) {
		"use strict";

        $scope.getSelectedLabel = labels.getSelected;
	}
);
