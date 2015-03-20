/**
 * @namespace dias.projects
 * @ngdoc directive
 * @name projectMemberContainer
 * @memberOf dias.projects
 * @description Contains project members of a certain role. New members can be dropped in.
 */
angular.module('dias.projects').directive('projectMemberContainer', function () {
		"use strict";

		return {
			restrict: 'A',
			// each container has its own scope
			scope: true,
			link: function (scope, element, attrs) {
				var dragover = function (e) {
					scope.hovering = true;
					scope.$apply();
					 e.preventDefault();
				};

				var dragleave = function (e) {
					scope.hovering = false;
					scope.$apply();
				};

				var drop = function (e) {
					scope.hovering = false;
					scope.changeUserRole(
						// user id
						e.dataTransfer.getData('text/plain'),
						// new role name
						attrs.role
					);
					scope.$apply();
					e.preventDefault();
				};

				// only allow dropping if editing
				scope.$watch('editing', function (editing) {
					if (editing) {
						element.on('dragover', dragover);
						element.on('dragleave', dragleave);
						element.on('drop', drop);
					} else {
						element.off('dragover', dragover);
						element.off('dragleave', dragleave);
						element.off('drop', drop);
					}
				});
			}
		};
	}
);
