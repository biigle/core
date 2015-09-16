/**
 * @namespace dias.projects
 * @description The DIAS projects module.
 */
angular.module('dias.projects', ['dias.api', 'dias.ui.messages', 'dias.ui.users', 'ui.bootstrap']);

/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectDeleteController
 * @memberOf dias.projects
 * @description Initiates the deletion confirmation modal
 * @example

 */
angular.module('dias.projects').controller('ProjectDeleteController', ["$scope", "$modal", "$attrs", "msg", function ($scope, $modal, $attrs, msg) {
		"use strict";

		var success = function () {
			$scope.redirectToDashboard($attrs.successMsg);
		};

		var error = function () {
			msg.danger($attrs.errorMsg);
		};

		$scope.submit = function () {
			var modalInstance = $modal.open({
				templateUrl: 'confirmDeleteModal.html',
				size: 'sm',
				controller: 'ProjectDeleteModalController',
				scope: $scope
			});

			modalInstance.result.then(function (result) {
				switch (result) {
					case 'success':
						success();
						break;
					case 'error':
						error();
						break;
				}
			});
		};
	}]
);

/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectDeleteModalController
 * @memberOf dias.projects
 * @description Handles the confirmation of deletion of a project.
 * @example

 */
angular.module('dias.projects').controller('ProjectDeleteModalController', ["$scope", "Project", function ($scope, Project) {
		"use strict";

		$scope.force = false;

		var deleteSuccess = function (response) {
			$scope.$close('success');
		};

		var deleteError = function(response) {
			if (response.status === 400) {
				$scope.force = true;
			} else {
				$scope.$close('error');
			}
		};

		$scope.delete = function () {
			var params = $scope.force ? {force: true} : {};
			$scope.project.$delete(params, deleteSuccess, deleteError);
		};
	}]
);

/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectIndexController
 * @memberOf dias.projects
 * @description Root controller of the project index page.
 */
angular.module('dias.projects').controller('ProjectIndexController', ["$scope", "$attrs", "Project", "$modal", "ProjectUser", "msg", "$timeout", function ($scope, $attrs, Project, $modal, ProjectUser, msg, $timeout) {
		"use strict";

		var leavingSuccess = function () {
			$scope.redirectToDashboard($attrs.leavingSuccessMsg);
		};

		$scope.redirectToDashboard = function (message, type) {
			type = type || 'success';
			msg.post(type, message);
			$timeout(function () {
				window.location.href = $attrs.dashboardUrl;
			}, 2000);
		};

		$scope.project = Project.get({id: $attrs.projectId});

		$scope.projectId = $attrs.projectId;

		$scope.ownUserId = $attrs.userId;

		$scope.leaveProject = function () {
			var modalInstance = $modal.open({
				templateUrl: 'confirmLeaveProjectModal.html',
				size: 'sm'
			});

			modalInstance.result.then(function (result) {
				if (result == 'yes') {
					ProjectUser.detach({project_id: $scope.project.id}, {id: $scope.ownUserId}, leavingSuccess, msg.responseError);
				}
			});
		};
	}]
);

/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectInformationController
 * @memberOf dias.projects
 * @description Handles modification of the information of a project.
 * @example

 */
angular.module('dias.projects').controller('ProjectInformationController', ["$scope", function ($scope) {
		"use strict";
		
		$scope.edit = function () {
			$scope.editing = !$scope.editing;
		};
	}]
);

/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectLabelsController
 * @memberOf dias.projects
 * @description Handles modification of the labels of a project.
 * @example

 */
angular.module('dias.projects').controller('ProjectLabelsController', ["$scope", "ProjectLabel", "Label", "msg", function ($scope, ProjectLabel, Label, msg) {
		"use strict";

        var buildTree = function (label) {
            var parent = label.parent_id;
            if ($scope.categoriesTree[parent]) {
                $scope.categoriesTree[parent].push(label);
            } else {
                $scope.categoriesTree[parent] = [label];
            }
        };

        var refreshLabels = function () {
            $scope.labels = ProjectLabel.query({project_id: $scope.projectId}, function () {
                $scope.categoriesTree = {};
                $scope.labels.forEach(buildTree);
            });
        };

        refreshLabels();

        // label that should be newly created on submit
        $scope.newLabel = {
            parent_id: null,
            name: null,
            project_id: $scope.projectId
        };

        // currently selected label
        $scope.selected = {
            label: null
        };

        $scope.edit = function () {
            $scope.editing = !$scope.editing;
        };

        $scope.selectItem = function (item) {
            $scope.selected.label = item;
            $scope.newLabel.parent_id = item ? item.id : null;
            $scope.$broadcast('categories.selected', $scope.newLabel.parent_id);
        };

        $scope.remove = function (id) {
            // always use force here because the user already had to confirm deletion
            Label.delete({id: id, force: true}, function () {
                if ($scope.selected.label.id === id) {
                    $scope.selectItem(null);
                }
                refreshLabels();
            });
        };

        $scope.addLabel = function () {
            Label.add($scope.newLabel, function (response) {
                $scope.labels.push(response);
                buildTree(response);
                $scope.$broadcast('categories.refresh');
                $scope.newLabel.name = '';
            }, msg.responseError);
        };
	}]
);

/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectMembersContainerController
 * @memberOf dias.projects
 * @description Contains project members of a certain role. New members can be dropped in.
 */
angular.module('dias.projects').controller('ProjectMembersContainerController', ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {
		"use strict";

		var dragover = function (e) {
			$scope.hovering = true;
			$scope.$apply();
			 e.preventDefault();
		};

		var dragleave = function (e) {
			$scope.hovering = false;
			$scope.$apply();
		};

		var drop = function (e) {
			$scope.hovering = false;
			$scope.changeUserRole(
				// user id
				e.dataTransfer.getData('text/plain'),
				// new role name
				$attrs.role
			);
			$scope.$apply();
			e.preventDefault();
		};

		// only allow dropping if editing
		$scope.$watch('editing', function (editing) {
			if (editing) {
				$element.on('dragover', dragover);
				$element.on('dragleave', dragleave);
				$element.on('drop', drop);
			} else {
				$element.off('dragover', dragover);
				$element.off('dragleave', dragleave);
				$element.off('drop', drop);
			}
		});
	}]
);

/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectMembersController
 * @memberOf dias.projects
 * @description Handles modification of the members of a project.
 */
angular.module('dias.projects').controller('ProjectMembersController', ["$scope", "Role", "ProjectUser", "msg", "$modal", function ($scope, Role, ProjectUser, msg, $modal) {
		"use strict";

		var getUser = function (id) {
			for (var i = $scope.users.length - 1; i >= 0; i--) {
				if ($scope.users[i].id == id) {
					return $scope.users[i];
				}
			}
		};

		var confirmChangeOwnRole = function (userId, role) {
			var modalInstance = $modal.open({
				templateUrl: 'confirmChangeRoleModal.html',
				size: 'sm'
			});

			modalInstance.result.then(function (result) {
				if (result == 'yes') {
					$scope.changeUserRole(userId, role, true);
				}
			});
		};

		Role.query(function (rolesArray) {
			$scope.roles = {};
			for (var i = rolesArray.length - 1; i >= 0; i--) {
				$scope.roles[rolesArray[i].name] = rolesArray[i].id;
			}
		});

		$scope.users = ProjectUser.query({ project_id: $scope.projectId });

		$scope.edit = function () {
			$scope.editing = !$scope.editing;
		};

		$scope.addUser = function (user) {
			// new users are guests by default
			var roleId = $scope.roles.guest;

			var success = function () {
				user.project_role_id = roleId;
				$scope.users.push(user);
			};

			// user shouldn't already exist
			if (!getUser(user.id)) {
				ProjectUser.attach(
					{project_id: $scope.projectId},
					{id: user.id, project_role_id: roleId},
					success, msg.responseError
				);
			}
		};

		$scope.changeUserRole = function (userId, role, force) {
			if (!force && userId == $scope.ownUserId) {
				confirmChangeOwnRole(userId, role);
				return;
			}

			var user = getUser(userId);
			var roleId = $scope.roles[role];

			// no action required
			if (user.project_role_id == roleId) {
				return;
			}

			var success = function () {
				user.project_role_id = roleId;
			};

			ProjectUser.save(
				{project_id: $scope.projectId},
				{id: user.id, project_role_id: roleId},
				success, msg.responseError
			);
		};

		$scope.removeUser = function (userId) {
			// leaving the project will be handled by parent controller
			if (userId == $scope.ownUserId) {
				$scope.leaveProject();
				return;
			}

			var success = function () {
				var index;

				for (var i = $scope.users.length - 1; i >= 0; i--) {
					if ($scope.users[i].id == userId) {
						index = i;
						break;
					}
				}

				$scope.users.splice(index, 1);
			};

			ProjectUser.detach(
				{project_id: $scope.projectId},
				{id: userId},
				success, msg.responseError
			);
		};
	}]
);

/**
 * @namespace dias.projects
 * @ngdoc directive
 * @name projectLabelCategoryItem
 * @memberOf dias.projects
 * @description A label category list item.
 */
angular.module('dias.projects').directive('projectLabelCategoryItem', ["$compile", "$timeout", "$templateCache", function ($compile, $timeout, $templateCache) {
        "use strict";

        return {
            restrict: 'C',

            templateUrl: 'label-item.html',

            scope: true,

            link: function (scope, element, attrs) {
                // wait for this element to be rendered until the children are
                // appended, otherwise there would be too much recursion for
                // angular
                var content = angular.element($templateCache.get('label-subtree.html'));
                $timeout(function () {
                    element.append($compile(content)(scope));
                });
            },

            controller: ["$scope", function ($scope) {
                // open the subtree of this item
                $scope.isOpen = false;
                // this item has children
                $scope.isExpandable = !!$scope.categoriesTree[$scope.item.id];
                // this item is currently selected
                $scope.isSelected = false;
                // the user clicked on the 'x' button
                $scope.removing = false;

                $scope.startRemove = function () {
                    $scope.removing = true;
                };

                $scope.cancelRemove = function () {
                    $scope.removing = false;
                };

                // handle this by the event rather than an own click handler to
                // deal with click and search field actions in a unified way
                $scope.$on('categories.selected', function (e, categoryId) {
                    // if an item is selected, its subtree and all parent items
                    // should be opened
                    if ($scope.item.id === categoryId) {
                        $scope.isOpen = true;
                        $scope.isSelected = true;
                        // this hits all parent scopes/items
                        $scope.$emit('categories.openParents');
                    } else {
                        $scope.isOpen = false;
                        $scope.isSelected = false;
                    }
                });

                // if a child item was selected, this item should be opened, too
                // so the selected item becomes visible in the tree
                $scope.$on('categories.openParents', function (e) {
                    $scope.isOpen = true;
                    // stop propagation if this is a root element
                    if ($scope.item.parent_id === null) {
                        e.stopPropagation();
                    }
                });

                // check, if item still has children
                $scope.$on('categories.refresh', function (e) {
                    $scope.isExpandable = !!$scope.categoriesTree[$scope.item.id];
                });
            }]
        };
    }]
);

/**
 * @namespace dias.projects
 * @ngdoc directive
 * @name projectMember
 * @memberOf dias.projects
 * @description A project member element in the project members overview.
 */
angular.module('dias.projects').directive('projectMember', function () {
		"use strict";

		return {
			restrict: 'A',

			link: function (scope, element, attrs) {
				var dragstart = function (e) {
					e.dataTransfer.effectAllowed = 'move';
  					e.dataTransfer.setData('text/plain', scope.user.id);
				};

				// disable dragging when removing is in progress
				scope.$watch('removing', function (removing) {
					if (removing) {
						element.off('dragstart', dragstart);
					} else {
						element.on('dragstart', dragstart);
					}
				});

				// when editing is switched off, removing is canceled, too
				scope.$watch('editing', function (editing) {
					if (!editing) {
						scope.cancelRemove();
					}
				});
			},
			
			controller: ["$scope", function ($scope) {
				$scope.startRemove = function () {
					$scope.removing = true;
				};

				$scope.cancelRemove = function () {
					$scope.removing = false;
				};

				$scope.remove = function () {
					$scope.removeUser($scope.user.id);
				};
			}]
		};
	}
);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9Qcm9qZWN0RGVsZXRlQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1Byb2plY3REZWxldGVNb2RhbENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Qcm9qZWN0SW5kZXhDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvUHJvamVjdEluZm9ybWF0aW9uQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1Byb2plY3RMYWJlbHNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvUHJvamVjdE1lbWJlcnNDb250YWluZXJDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvUHJvamVjdE1lbWJlcnNDb250cm9sbGVyLmpzIiwiZGlyZWN0aXZlcy9sYWJlbENhdGVnb3J5SXRlbS5qcyIsImRpcmVjdGl2ZXMvcHJvamVjdE1lbWJlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQUlBLFFBQUEsT0FBQSxpQkFBQSxDQUFBLFlBQUEsb0JBQUEsaUJBQUE7Ozs7Ozs7Ozs7O0FDS0EsUUFBQSxPQUFBLGlCQUFBLFdBQUEsaUVBQUEsVUFBQSxRQUFBLFFBQUEsUUFBQSxLQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBLFlBQUE7R0FDQSxPQUFBLG9CQUFBLE9BQUE7OztFQUdBLElBQUEsUUFBQSxZQUFBO0dBQ0EsSUFBQSxPQUFBLE9BQUE7OztFQUdBLE9BQUEsU0FBQSxZQUFBO0dBQ0EsSUFBQSxnQkFBQSxPQUFBLEtBQUE7SUFDQSxhQUFBO0lBQ0EsTUFBQTtJQUNBLFlBQUE7SUFDQSxPQUFBOzs7R0FHQSxjQUFBLE9BQUEsS0FBQSxVQUFBLFFBQUE7SUFDQSxRQUFBO0tBQ0EsS0FBQTtNQUNBO01BQ0E7S0FDQSxLQUFBO01BQ0E7TUFDQTs7Ozs7Ozs7Ozs7Ozs7OztBQzFCQSxRQUFBLE9BQUEsaUJBQUEsV0FBQSxzREFBQSxVQUFBLFFBQUEsU0FBQTtFQUNBOztFQUVBLE9BQUEsUUFBQTs7RUFFQSxJQUFBLGdCQUFBLFVBQUEsVUFBQTtHQUNBLE9BQUEsT0FBQTs7O0VBR0EsSUFBQSxjQUFBLFNBQUEsVUFBQTtHQUNBLElBQUEsU0FBQSxXQUFBLEtBQUE7SUFDQSxPQUFBLFFBQUE7VUFDQTtJQUNBLE9BQUEsT0FBQTs7OztFQUlBLE9BQUEsU0FBQSxZQUFBO0dBQ0EsSUFBQSxTQUFBLE9BQUEsUUFBQSxDQUFBLE9BQUEsUUFBQTtHQUNBLE9BQUEsUUFBQSxRQUFBLFFBQUEsZUFBQTs7Ozs7Ozs7Ozs7O0FDckJBLFFBQUEsT0FBQSxpQkFBQSxXQUFBLHNHQUFBLFVBQUEsUUFBQSxRQUFBLFNBQUEsUUFBQSxhQUFBLEtBQUEsVUFBQTtFQUNBOztFQUVBLElBQUEsaUJBQUEsWUFBQTtHQUNBLE9BQUEsb0JBQUEsT0FBQTs7O0VBR0EsT0FBQSxzQkFBQSxVQUFBLFNBQUEsTUFBQTtHQUNBLE9BQUEsUUFBQTtHQUNBLElBQUEsS0FBQSxNQUFBO0dBQ0EsU0FBQSxZQUFBO0lBQ0EsT0FBQSxTQUFBLE9BQUEsT0FBQTtNQUNBOzs7RUFHQSxPQUFBLFVBQUEsUUFBQSxJQUFBLENBQUEsSUFBQSxPQUFBOztFQUVBLE9BQUEsWUFBQSxPQUFBOztFQUVBLE9BQUEsWUFBQSxPQUFBOztFQUVBLE9BQUEsZUFBQSxZQUFBO0dBQ0EsSUFBQSxnQkFBQSxPQUFBLEtBQUE7SUFDQSxhQUFBO0lBQ0EsTUFBQTs7O0dBR0EsY0FBQSxPQUFBLEtBQUEsVUFBQSxRQUFBO0lBQ0EsSUFBQSxVQUFBLE9BQUE7S0FDQSxZQUFBLE9BQUEsQ0FBQSxZQUFBLE9BQUEsUUFBQSxLQUFBLENBQUEsSUFBQSxPQUFBLFlBQUEsZ0JBQUEsSUFBQTs7Ozs7Ozs7Ozs7Ozs7OztBQzNCQSxRQUFBLE9BQUEsaUJBQUEsV0FBQSwyQ0FBQSxVQUFBLFFBQUE7RUFDQTs7RUFFQSxPQUFBLE9BQUEsWUFBQTtHQUNBLE9BQUEsVUFBQSxDQUFBLE9BQUE7Ozs7Ozs7Ozs7Ozs7O0FDSkEsUUFBQSxPQUFBLGlCQUFBLFdBQUEsc0VBQUEsVUFBQSxRQUFBLGNBQUEsT0FBQSxLQUFBO0VBQ0E7O1FBRUEsSUFBQSxZQUFBLFVBQUEsT0FBQTtZQUNBLElBQUEsU0FBQSxNQUFBO1lBQ0EsSUFBQSxPQUFBLGVBQUEsU0FBQTtnQkFDQSxPQUFBLGVBQUEsUUFBQSxLQUFBO21CQUNBO2dCQUNBLE9BQUEsZUFBQSxVQUFBLENBQUE7Ozs7UUFJQSxJQUFBLGdCQUFBLFlBQUE7WUFDQSxPQUFBLFNBQUEsYUFBQSxNQUFBLENBQUEsWUFBQSxPQUFBLFlBQUEsWUFBQTtnQkFDQSxPQUFBLGlCQUFBO2dCQUNBLE9BQUEsT0FBQSxRQUFBOzs7O1FBSUE7OztRQUdBLE9BQUEsV0FBQTtZQUNBLFdBQUE7WUFDQSxNQUFBO1lBQ0EsWUFBQSxPQUFBOzs7O1FBSUEsT0FBQSxXQUFBO1lBQ0EsT0FBQTs7O1FBR0EsT0FBQSxPQUFBLFlBQUE7WUFDQSxPQUFBLFVBQUEsQ0FBQSxPQUFBOzs7UUFHQSxPQUFBLGFBQUEsVUFBQSxNQUFBO1lBQ0EsT0FBQSxTQUFBLFFBQUE7WUFDQSxPQUFBLFNBQUEsWUFBQSxPQUFBLEtBQUEsS0FBQTtZQUNBLE9BQUEsV0FBQSx1QkFBQSxPQUFBLFNBQUE7OztRQUdBLE9BQUEsU0FBQSxVQUFBLElBQUE7O1lBRUEsTUFBQSxPQUFBLENBQUEsSUFBQSxJQUFBLE9BQUEsT0FBQSxZQUFBO2dCQUNBLElBQUEsT0FBQSxTQUFBLE1BQUEsT0FBQSxJQUFBO29CQUNBLE9BQUEsV0FBQTs7Z0JBRUE7Ozs7UUFJQSxPQUFBLFdBQUEsWUFBQTtZQUNBLE1BQUEsSUFBQSxPQUFBLFVBQUEsVUFBQSxVQUFBO2dCQUNBLE9BQUEsT0FBQSxLQUFBO2dCQUNBLFVBQUE7Z0JBQ0EsT0FBQSxXQUFBO2dCQUNBLE9BQUEsU0FBQSxPQUFBO2VBQ0EsSUFBQTs7Ozs7Ozs7Ozs7O0FDN0RBLFFBQUEsT0FBQSxpQkFBQSxXQUFBLHNFQUFBLFVBQUEsUUFBQSxVQUFBLFFBQUE7RUFDQTs7RUFFQSxJQUFBLFdBQUEsVUFBQSxHQUFBO0dBQ0EsT0FBQSxXQUFBO0dBQ0EsT0FBQTtJQUNBLEVBQUE7OztFQUdBLElBQUEsWUFBQSxVQUFBLEdBQUE7R0FDQSxPQUFBLFdBQUE7R0FDQSxPQUFBOzs7RUFHQSxJQUFBLE9BQUEsVUFBQSxHQUFBO0dBQ0EsT0FBQSxXQUFBO0dBQ0EsT0FBQTs7SUFFQSxFQUFBLGFBQUEsUUFBQTs7SUFFQSxPQUFBOztHQUVBLE9BQUE7R0FDQSxFQUFBOzs7O0VBSUEsT0FBQSxPQUFBLFdBQUEsVUFBQSxTQUFBO0dBQ0EsSUFBQSxTQUFBO0lBQ0EsU0FBQSxHQUFBLFlBQUE7SUFDQSxTQUFBLEdBQUEsYUFBQTtJQUNBLFNBQUEsR0FBQSxRQUFBO1VBQ0E7SUFDQSxTQUFBLElBQUEsWUFBQTtJQUNBLFNBQUEsSUFBQSxhQUFBO0lBQ0EsU0FBQSxJQUFBLFFBQUE7Ozs7Ozs7Ozs7Ozs7QUNuQ0EsUUFBQSxPQUFBLGlCQUFBLFdBQUEsK0VBQUEsVUFBQSxRQUFBLE1BQUEsYUFBQSxLQUFBLFFBQUE7RUFDQTs7RUFFQSxJQUFBLFVBQUEsVUFBQSxJQUFBO0dBQ0EsS0FBQSxJQUFBLElBQUEsT0FBQSxNQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtJQUNBLElBQUEsT0FBQSxNQUFBLEdBQUEsTUFBQSxJQUFBO0tBQ0EsT0FBQSxPQUFBLE1BQUE7Ozs7O0VBS0EsSUFBQSx1QkFBQSxVQUFBLFFBQUEsTUFBQTtHQUNBLElBQUEsZ0JBQUEsT0FBQSxLQUFBO0lBQ0EsYUFBQTtJQUNBLE1BQUE7OztHQUdBLGNBQUEsT0FBQSxLQUFBLFVBQUEsUUFBQTtJQUNBLElBQUEsVUFBQSxPQUFBO0tBQ0EsT0FBQSxlQUFBLFFBQUEsTUFBQTs7Ozs7RUFLQSxLQUFBLE1BQUEsVUFBQSxZQUFBO0dBQ0EsT0FBQSxRQUFBO0dBQ0EsS0FBQSxJQUFBLElBQUEsV0FBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7SUFDQSxPQUFBLE1BQUEsV0FBQSxHQUFBLFFBQUEsV0FBQSxHQUFBOzs7O0VBSUEsT0FBQSxRQUFBLFlBQUEsTUFBQSxFQUFBLFlBQUEsT0FBQTs7RUFFQSxPQUFBLE9BQUEsWUFBQTtHQUNBLE9BQUEsVUFBQSxDQUFBLE9BQUE7OztFQUdBLE9BQUEsVUFBQSxVQUFBLE1BQUE7O0dBRUEsSUFBQSxTQUFBLE9BQUEsTUFBQTs7R0FFQSxJQUFBLFVBQUEsWUFBQTtJQUNBLEtBQUEsa0JBQUE7SUFDQSxPQUFBLE1BQUEsS0FBQTs7OztHQUlBLElBQUEsQ0FBQSxRQUFBLEtBQUEsS0FBQTtJQUNBLFlBQUE7S0FDQSxDQUFBLFlBQUEsT0FBQTtLQUNBLENBQUEsSUFBQSxLQUFBLElBQUEsaUJBQUE7S0FDQSxTQUFBLElBQUE7Ozs7O0VBS0EsT0FBQSxpQkFBQSxVQUFBLFFBQUEsTUFBQSxPQUFBO0dBQ0EsSUFBQSxDQUFBLFNBQUEsVUFBQSxPQUFBLFdBQUE7SUFDQSxxQkFBQSxRQUFBO0lBQ0E7OztHQUdBLElBQUEsT0FBQSxRQUFBO0dBQ0EsSUFBQSxTQUFBLE9BQUEsTUFBQTs7O0dBR0EsSUFBQSxLQUFBLG1CQUFBLFFBQUE7SUFDQTs7O0dBR0EsSUFBQSxVQUFBLFlBQUE7SUFDQSxLQUFBLGtCQUFBOzs7R0FHQSxZQUFBO0lBQ0EsQ0FBQSxZQUFBLE9BQUE7SUFDQSxDQUFBLElBQUEsS0FBQSxJQUFBLGlCQUFBO0lBQ0EsU0FBQSxJQUFBOzs7O0VBSUEsT0FBQSxhQUFBLFVBQUEsUUFBQTs7R0FFQSxJQUFBLFVBQUEsT0FBQSxXQUFBO0lBQ0EsT0FBQTtJQUNBOzs7R0FHQSxJQUFBLFVBQUEsWUFBQTtJQUNBLElBQUE7O0lBRUEsS0FBQSxJQUFBLElBQUEsT0FBQSxNQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtLQUNBLElBQUEsT0FBQSxNQUFBLEdBQUEsTUFBQSxRQUFBO01BQ0EsUUFBQTtNQUNBOzs7O0lBSUEsT0FBQSxNQUFBLE9BQUEsT0FBQTs7O0dBR0EsWUFBQTtJQUNBLENBQUEsWUFBQSxPQUFBO0lBQ0EsQ0FBQSxJQUFBO0lBQ0EsU0FBQSxJQUFBOzs7Ozs7Ozs7Ozs7O0FDeEdBLFFBQUEsT0FBQSxpQkFBQSxVQUFBLHVFQUFBLFVBQUEsVUFBQSxVQUFBLGdCQUFBO1FBQ0E7O1FBRUEsT0FBQTtZQUNBLFVBQUE7O1lBRUEsYUFBQTs7WUFFQSxPQUFBOztZQUVBLE1BQUEsVUFBQSxPQUFBLFNBQUEsT0FBQTs7OztnQkFJQSxJQUFBLFVBQUEsUUFBQSxRQUFBLGVBQUEsSUFBQTtnQkFDQSxTQUFBLFlBQUE7b0JBQ0EsUUFBQSxPQUFBLFNBQUEsU0FBQTs7OztZQUlBLHVCQUFBLFVBQUEsUUFBQTs7Z0JBRUEsT0FBQSxTQUFBOztnQkFFQSxPQUFBLGVBQUEsQ0FBQSxDQUFBLE9BQUEsZUFBQSxPQUFBLEtBQUE7O2dCQUVBLE9BQUEsYUFBQTs7Z0JBRUEsT0FBQSxXQUFBOztnQkFFQSxPQUFBLGNBQUEsWUFBQTtvQkFDQSxPQUFBLFdBQUE7OztnQkFHQSxPQUFBLGVBQUEsWUFBQTtvQkFDQSxPQUFBLFdBQUE7Ozs7O2dCQUtBLE9BQUEsSUFBQSx1QkFBQSxVQUFBLEdBQUEsWUFBQTs7O29CQUdBLElBQUEsT0FBQSxLQUFBLE9BQUEsWUFBQTt3QkFDQSxPQUFBLFNBQUE7d0JBQ0EsT0FBQSxhQUFBOzt3QkFFQSxPQUFBLE1BQUE7MkJBQ0E7d0JBQ0EsT0FBQSxTQUFBO3dCQUNBLE9BQUEsYUFBQTs7Ozs7O2dCQU1BLE9BQUEsSUFBQSwwQkFBQSxVQUFBLEdBQUE7b0JBQ0EsT0FBQSxTQUFBOztvQkFFQSxJQUFBLE9BQUEsS0FBQSxjQUFBLE1BQUE7d0JBQ0EsRUFBQTs7Ozs7Z0JBS0EsT0FBQSxJQUFBLHNCQUFBLFVBQUEsR0FBQTtvQkFDQSxPQUFBLGVBQUEsQ0FBQSxDQUFBLE9BQUEsZUFBQSxPQUFBLEtBQUE7Ozs7Ozs7Ozs7Ozs7O0FDbEVBLFFBQUEsT0FBQSxpQkFBQSxVQUFBLGlCQUFBLFlBQUE7RUFDQTs7RUFFQSxPQUFBO0dBQ0EsVUFBQTs7R0FFQSxNQUFBLFVBQUEsT0FBQSxTQUFBLE9BQUE7SUFDQSxJQUFBLFlBQUEsVUFBQSxHQUFBO0tBQ0EsRUFBQSxhQUFBLGdCQUFBO09BQ0EsRUFBQSxhQUFBLFFBQUEsY0FBQSxNQUFBLEtBQUE7Ozs7SUFJQSxNQUFBLE9BQUEsWUFBQSxVQUFBLFVBQUE7S0FDQSxJQUFBLFVBQUE7TUFDQSxRQUFBLElBQUEsYUFBQTtZQUNBO01BQ0EsUUFBQSxHQUFBLGFBQUE7Ozs7O0lBS0EsTUFBQSxPQUFBLFdBQUEsVUFBQSxTQUFBO0tBQ0EsSUFBQSxDQUFBLFNBQUE7TUFDQSxNQUFBOzs7OztHQUtBLHVCQUFBLFVBQUEsUUFBQTtJQUNBLE9BQUEsY0FBQSxZQUFBO0tBQ0EsT0FBQSxXQUFBOzs7SUFHQSxPQUFBLGVBQUEsWUFBQTtLQUNBLE9BQUEsV0FBQTs7O0lBR0EsT0FBQSxTQUFBLFlBQUE7S0FDQSxPQUFBLFdBQUEsT0FBQSxLQUFBOzs7Ozs7QUFNQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyBwcm9qZWN0cyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJywgWydkaWFzLmFwaScsICdkaWFzLnVpLm1lc3NhZ2VzJywgJ2RpYXMudWkudXNlcnMnLCAndWkuYm9vdHN0cmFwJ10pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBQcm9qZWN0RGVsZXRlQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBJbml0aWF0ZXMgdGhlIGRlbGV0aW9uIGNvbmZpcm1hdGlvbiBtb2RhbFxuICogQGV4YW1wbGVcblxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3REZWxldGVDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJG1vZGFsLCAkYXR0cnMsIG1zZykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUucmVkaXJlY3RUb0Rhc2hib2FyZCgkYXR0cnMuc3VjY2Vzc01zZyk7XG5cdFx0fTtcblxuXHRcdHZhciBlcnJvciA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdG1zZy5kYW5nZXIoJGF0dHJzLmVycm9yTXNnKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnN1Ym1pdCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBtb2RhbEluc3RhbmNlID0gJG1vZGFsLm9wZW4oe1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJ2NvbmZpcm1EZWxldGVNb2RhbC5odG1sJyxcblx0XHRcdFx0c2l6ZTogJ3NtJyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ1Byb2plY3REZWxldGVNb2RhbENvbnRyb2xsZXInLFxuXHRcdFx0XHRzY29wZTogJHNjb3BlXG5cdFx0XHR9KTtcblxuXHRcdFx0bW9kYWxJbnN0YW5jZS5yZXN1bHQudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG5cdFx0XHRcdHN3aXRjaCAocmVzdWx0KSB7XG5cdFx0XHRcdFx0Y2FzZSAnc3VjY2Vzcyc6XG5cdFx0XHRcdFx0XHRzdWNjZXNzKCk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlICdlcnJvcic6XG5cdFx0XHRcdFx0XHRlcnJvcigpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFByb2plY3REZWxldGVNb2RhbENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSGFuZGxlcyB0aGUgY29uZmlybWF0aW9uIG9mIGRlbGV0aW9uIG9mIGEgcHJvamVjdC5cbiAqIEBleGFtcGxlXG5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0RGVsZXRlTW9kYWxDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgUHJvamVjdCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0JHNjb3BlLmZvcmNlID0gZmFsc2U7XG5cblx0XHR2YXIgZGVsZXRlU3VjY2VzcyA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0JHNjb3BlLiRjbG9zZSgnc3VjY2VzcycpO1xuXHRcdH07XG5cblx0XHR2YXIgZGVsZXRlRXJyb3IgPSBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0aWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAwKSB7XG5cdFx0XHRcdCRzY29wZS5mb3JjZSA9IHRydWU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkc2NvcGUuJGNsb3NlKCdlcnJvcicpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQkc2NvcGUuZGVsZXRlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHBhcmFtcyA9ICRzY29wZS5mb3JjZSA/IHtmb3JjZTogdHJ1ZX0gOiB7fTtcblx0XHRcdCRzY29wZS5wcm9qZWN0LiRkZWxldGUocGFyYW1zLCBkZWxldGVTdWNjZXNzLCBkZWxldGVFcnJvcik7XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdEluZGV4Q29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBSb290IGNvbnRyb2xsZXIgb2YgdGhlIHByb2plY3QgaW5kZXggcGFnZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0SW5kZXhDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJGF0dHJzLCBQcm9qZWN0LCAkbW9kYWwsIFByb2plY3RVc2VyLCBtc2csICR0aW1lb3V0KSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgbGVhdmluZ1N1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUucmVkaXJlY3RUb0Rhc2hib2FyZCgkYXR0cnMubGVhdmluZ1N1Y2Nlc3NNc2cpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucmVkaXJlY3RUb0Rhc2hib2FyZCA9IGZ1bmN0aW9uIChtZXNzYWdlLCB0eXBlKSB7XG5cdFx0XHR0eXBlID0gdHlwZSB8fCAnc3VjY2Vzcyc7XG5cdFx0XHRtc2cucG9zdCh0eXBlLCBtZXNzYWdlKTtcblx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0d2luZG93LmxvY2F0aW9uLmhyZWYgPSAkYXR0cnMuZGFzaGJvYXJkVXJsO1xuXHRcdFx0fSwgMjAwMCk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5wcm9qZWN0ID0gUHJvamVjdC5nZXQoe2lkOiAkYXR0cnMucHJvamVjdElkfSk7XG5cblx0XHQkc2NvcGUucHJvamVjdElkID0gJGF0dHJzLnByb2plY3RJZDtcblxuXHRcdCRzY29wZS5vd25Vc2VySWQgPSAkYXR0cnMudXNlcklkO1xuXG5cdFx0JHNjb3BlLmxlYXZlUHJvamVjdCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBtb2RhbEluc3RhbmNlID0gJG1vZGFsLm9wZW4oe1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJ2NvbmZpcm1MZWF2ZVByb2plY3RNb2RhbC5odG1sJyxcblx0XHRcdFx0c2l6ZTogJ3NtJ1xuXHRcdFx0fSk7XG5cblx0XHRcdG1vZGFsSW5zdGFuY2UucmVzdWx0LnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuXHRcdFx0XHRpZiAocmVzdWx0ID09ICd5ZXMnKSB7XG5cdFx0XHRcdFx0UHJvamVjdFVzZXIuZGV0YWNoKHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdC5pZH0sIHtpZDogJHNjb3BlLm93blVzZXJJZH0sIGxlYXZpbmdTdWNjZXNzLCBtc2cucmVzcG9uc2VFcnJvcik7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFByb2plY3RJbmZvcm1hdGlvbkNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSGFuZGxlcyBtb2RpZmljYXRpb24gb2YgdGhlIGluZm9ybWF0aW9uIG9mIGEgcHJvamVjdC5cbiAqIEBleGFtcGxlXG5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0SW5mb3JtYXRpb25Db250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXHRcdFxuXHRcdCRzY29wZS5lZGl0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLmVkaXRpbmcgPSAhJHNjb3BlLmVkaXRpbmc7XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdExhYmVsc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSGFuZGxlcyBtb2RpZmljYXRpb24gb2YgdGhlIGxhYmVscyBvZiBhIHByb2plY3QuXG4gKiBAZXhhbXBsZVxuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJykuY29udHJvbGxlcignUHJvamVjdExhYmVsc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBQcm9qZWN0TGFiZWwsIExhYmVsLCBtc2cpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgYnVpbGRUcmVlID0gZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gbGFiZWwucGFyZW50X2lkO1xuICAgICAgICAgICAgaWYgKCRzY29wZS5jYXRlZ29yaWVzVHJlZVtwYXJlbnRdKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXNUcmVlW3BhcmVudF0ucHVzaChsYWJlbCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzY29wZS5jYXRlZ29yaWVzVHJlZVtwYXJlbnRdID0gW2xhYmVsXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcmVmcmVzaExhYmVscyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5sYWJlbHMgPSBQcm9qZWN0TGFiZWwucXVlcnkoe3Byb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0SWR9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXNUcmVlID0ge307XG4gICAgICAgICAgICAgICAgJHNjb3BlLmxhYmVscy5mb3JFYWNoKGJ1aWxkVHJlZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICByZWZyZXNoTGFiZWxzKCk7XG5cbiAgICAgICAgLy8gbGFiZWwgdGhhdCBzaG91bGQgYmUgbmV3bHkgY3JlYXRlZCBvbiBzdWJtaXRcbiAgICAgICAgJHNjb3BlLm5ld0xhYmVsID0ge1xuICAgICAgICAgICAgcGFyZW50X2lkOiBudWxsLFxuICAgICAgICAgICAgbmFtZTogbnVsbCxcbiAgICAgICAgICAgIHByb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0SWRcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBjdXJyZW50bHkgc2VsZWN0ZWQgbGFiZWxcbiAgICAgICAgJHNjb3BlLnNlbGVjdGVkID0ge1xuICAgICAgICAgICAgbGFiZWw6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZWRpdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lZGl0aW5nID0gISRzY29wZS5lZGl0aW5nO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zZWxlY3RJdGVtID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZC5sYWJlbCA9IGl0ZW07XG4gICAgICAgICAgICAkc2NvcGUubmV3TGFiZWwucGFyZW50X2lkID0gaXRlbSA/IGl0ZW0uaWQgOiBudWxsO1xuICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ2NhdGVnb3JpZXMuc2VsZWN0ZWQnLCAkc2NvcGUubmV3TGFiZWwucGFyZW50X2lkKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUucmVtb3ZlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICAvLyBhbHdheXMgdXNlIGZvcmNlIGhlcmUgYmVjYXVzZSB0aGUgdXNlciBhbHJlYWR5IGhhZCB0byBjb25maXJtIGRlbGV0aW9uXG4gICAgICAgICAgICBMYWJlbC5kZWxldGUoe2lkOiBpZCwgZm9yY2U6IHRydWV9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCRzY29wZS5zZWxlY3RlZC5sYWJlbC5pZCA9PT0gaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdEl0ZW0obnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlZnJlc2hMYWJlbHMoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5hZGRMYWJlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIExhYmVsLmFkZCgkc2NvcGUubmV3TGFiZWwsIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5sYWJlbHMucHVzaChyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgYnVpbGRUcmVlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnY2F0ZWdvcmllcy5yZWZyZXNoJyk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLm5ld0xhYmVsLm5hbWUgPSAnJztcbiAgICAgICAgICAgIH0sIG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgfTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdE1lbWJlcnNDb250YWluZXJDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIENvbnRhaW5zIHByb2plY3QgbWVtYmVycyBvZiBhIGNlcnRhaW4gcm9sZS4gTmV3IG1lbWJlcnMgY2FuIGJlIGRyb3BwZWQgaW4uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJykuY29udHJvbGxlcignUHJvamVjdE1lbWJlcnNDb250YWluZXJDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQsICRhdHRycykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIGRyYWdvdmVyID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdCRzY29wZS5ob3ZlcmluZyA9IHRydWU7XG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0XHQgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH07XG5cblx0XHR2YXIgZHJhZ2xlYXZlID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdCRzY29wZS5ob3ZlcmluZyA9IGZhbHNlO1xuXHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdH07XG5cblx0XHR2YXIgZHJvcCA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHQkc2NvcGUuaG92ZXJpbmcgPSBmYWxzZTtcblx0XHRcdCRzY29wZS5jaGFuZ2VVc2VyUm9sZShcblx0XHRcdFx0Ly8gdXNlciBpZFxuXHRcdFx0XHRlLmRhdGFUcmFuc2Zlci5nZXREYXRhKCd0ZXh0L3BsYWluJyksXG5cdFx0XHRcdC8vIG5ldyByb2xlIG5hbWVcblx0XHRcdFx0JGF0dHJzLnJvbGVcblx0XHRcdCk7XG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fTtcblxuXHRcdC8vIG9ubHkgYWxsb3cgZHJvcHBpbmcgaWYgZWRpdGluZ1xuXHRcdCRzY29wZS4kd2F0Y2goJ2VkaXRpbmcnLCBmdW5jdGlvbiAoZWRpdGluZykge1xuXHRcdFx0aWYgKGVkaXRpbmcpIHtcblx0XHRcdFx0JGVsZW1lbnQub24oJ2RyYWdvdmVyJywgZHJhZ292ZXIpO1xuXHRcdFx0XHQkZWxlbWVudC5vbignZHJhZ2xlYXZlJywgZHJhZ2xlYXZlKTtcblx0XHRcdFx0JGVsZW1lbnQub24oJ2Ryb3AnLCBkcm9wKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRlbGVtZW50Lm9mZignZHJhZ292ZXInLCBkcmFnb3Zlcik7XG5cdFx0XHRcdCRlbGVtZW50Lm9mZignZHJhZ2xlYXZlJywgZHJhZ2xlYXZlKTtcblx0XHRcdFx0JGVsZW1lbnQub2ZmKCdkcm9wJywgZHJvcCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFByb2plY3RNZW1iZXJzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIG1vZGlmaWNhdGlvbiBvZiB0aGUgbWVtYmVycyBvZiBhIHByb2plY3QuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJykuY29udHJvbGxlcignUHJvamVjdE1lbWJlcnNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgUm9sZSwgUHJvamVjdFVzZXIsIG1zZywgJG1vZGFsKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgZ2V0VXNlciA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0Zm9yICh2YXIgaSA9ICRzY29wZS51c2Vycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdFx0XHRpZiAoJHNjb3BlLnVzZXJzW2ldLmlkID09IGlkKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRzY29wZS51c2Vyc1tpXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR2YXIgY29uZmlybUNoYW5nZU93blJvbGUgPSBmdW5jdGlvbiAodXNlcklkLCByb2xlKSB7XG5cdFx0XHR2YXIgbW9kYWxJbnN0YW5jZSA9ICRtb2RhbC5vcGVuKHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICdjb25maXJtQ2hhbmdlUm9sZU1vZGFsLmh0bWwnLFxuXHRcdFx0XHRzaXplOiAnc20nXG5cdFx0XHR9KTtcblxuXHRcdFx0bW9kYWxJbnN0YW5jZS5yZXN1bHQudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG5cdFx0XHRcdGlmIChyZXN1bHQgPT0gJ3llcycpIHtcblx0XHRcdFx0XHQkc2NvcGUuY2hhbmdlVXNlclJvbGUodXNlcklkLCByb2xlLCB0cnVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdFJvbGUucXVlcnkoZnVuY3Rpb24gKHJvbGVzQXJyYXkpIHtcblx0XHRcdCRzY29wZS5yb2xlcyA9IHt9O1xuXHRcdFx0Zm9yICh2YXIgaSA9IHJvbGVzQXJyYXkubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdFx0JHNjb3BlLnJvbGVzW3JvbGVzQXJyYXlbaV0ubmFtZV0gPSByb2xlc0FycmF5W2ldLmlkO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLnVzZXJzID0gUHJvamVjdFVzZXIucXVlcnkoeyBwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdElkIH0pO1xuXG5cdFx0JHNjb3BlLmVkaXQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUuZWRpdGluZyA9ICEkc2NvcGUuZWRpdGluZztcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmFkZFVzZXIgPSBmdW5jdGlvbiAodXNlcikge1xuXHRcdFx0Ly8gbmV3IHVzZXJzIGFyZSBndWVzdHMgYnkgZGVmYXVsdFxuXHRcdFx0dmFyIHJvbGVJZCA9ICRzY29wZS5yb2xlcy5ndWVzdDtcblxuXHRcdFx0dmFyIHN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHVzZXIucHJvamVjdF9yb2xlX2lkID0gcm9sZUlkO1xuXHRcdFx0XHQkc2NvcGUudXNlcnMucHVzaCh1c2VyKTtcblx0XHRcdH07XG5cblx0XHRcdC8vIHVzZXIgc2hvdWxkbid0IGFscmVhZHkgZXhpc3Rcblx0XHRcdGlmICghZ2V0VXNlcih1c2VyLmlkKSkge1xuXHRcdFx0XHRQcm9qZWN0VXNlci5hdHRhY2goXG5cdFx0XHRcdFx0e3Byb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0SWR9LFxuXHRcdFx0XHRcdHtpZDogdXNlci5pZCwgcHJvamVjdF9yb2xlX2lkOiByb2xlSWR9LFxuXHRcdFx0XHRcdHN1Y2Nlc3MsIG1zZy5yZXNwb25zZUVycm9yXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS5jaGFuZ2VVc2VyUm9sZSA9IGZ1bmN0aW9uICh1c2VySWQsIHJvbGUsIGZvcmNlKSB7XG5cdFx0XHRpZiAoIWZvcmNlICYmIHVzZXJJZCA9PSAkc2NvcGUub3duVXNlcklkKSB7XG5cdFx0XHRcdGNvbmZpcm1DaGFuZ2VPd25Sb2xlKHVzZXJJZCwgcm9sZSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHVzZXIgPSBnZXRVc2VyKHVzZXJJZCk7XG5cdFx0XHR2YXIgcm9sZUlkID0gJHNjb3BlLnJvbGVzW3JvbGVdO1xuXG5cdFx0XHQvLyBubyBhY3Rpb24gcmVxdWlyZWRcblx0XHRcdGlmICh1c2VyLnByb2plY3Rfcm9sZV9pZCA9PSByb2xlSWQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0dXNlci5wcm9qZWN0X3JvbGVfaWQgPSByb2xlSWQ7XG5cdFx0XHR9O1xuXG5cdFx0XHRQcm9qZWN0VXNlci5zYXZlKFxuXHRcdFx0XHR7cHJvamVjdF9pZDogJHNjb3BlLnByb2plY3RJZH0sXG5cdFx0XHRcdHtpZDogdXNlci5pZCwgcHJvamVjdF9yb2xlX2lkOiByb2xlSWR9LFxuXHRcdFx0XHRzdWNjZXNzLCBtc2cucmVzcG9uc2VFcnJvclxuXHRcdFx0KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnJlbW92ZVVzZXIgPSBmdW5jdGlvbiAodXNlcklkKSB7XG5cdFx0XHQvLyBsZWF2aW5nIHRoZSBwcm9qZWN0IHdpbGwgYmUgaGFuZGxlZCBieSBwYXJlbnQgY29udHJvbGxlclxuXHRcdFx0aWYgKHVzZXJJZCA9PSAkc2NvcGUub3duVXNlcklkKSB7XG5cdFx0XHRcdCRzY29wZS5sZWF2ZVByb2plY3QoKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0dmFyIGluZGV4O1xuXG5cdFx0XHRcdGZvciAodmFyIGkgPSAkc2NvcGUudXNlcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdFx0XHRpZiAoJHNjb3BlLnVzZXJzW2ldLmlkID09IHVzZXJJZCkge1xuXHRcdFx0XHRcdFx0aW5kZXggPSBpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0JHNjb3BlLnVzZXJzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHR9O1xuXG5cdFx0XHRQcm9qZWN0VXNlci5kZXRhY2goXG5cdFx0XHRcdHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdElkfSxcblx0XHRcdFx0e2lkOiB1c2VySWR9LFxuXHRcdFx0XHRzdWNjZXNzLCBtc2cucmVzcG9uc2VFcnJvclxuXHRcdFx0KTtcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIHByb2plY3RMYWJlbENhdGVnb3J5SXRlbVxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBBIGxhYmVsIGNhdGVnb3J5IGxpc3QgaXRlbS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5kaXJlY3RpdmUoJ3Byb2plY3RMYWJlbENhdGVnb3J5SXRlbScsIGZ1bmN0aW9uICgkY29tcGlsZSwgJHRpbWVvdXQsICR0ZW1wbGF0ZUNhY2hlKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0MnLFxuXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2xhYmVsLWl0ZW0uaHRtbCcsXG5cbiAgICAgICAgICAgIHNjb3BlOiB0cnVlLFxuXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgLy8gd2FpdCBmb3IgdGhpcyBlbGVtZW50IHRvIGJlIHJlbmRlcmVkIHVudGlsIHRoZSBjaGlsZHJlbiBhcmVcbiAgICAgICAgICAgICAgICAvLyBhcHBlbmRlZCwgb3RoZXJ3aXNlIHRoZXJlIHdvdWxkIGJlIHRvbyBtdWNoIHJlY3Vyc2lvbiBmb3JcbiAgICAgICAgICAgICAgICAvLyBhbmd1bGFyXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSBhbmd1bGFyLmVsZW1lbnQoJHRlbXBsYXRlQ2FjaGUuZ2V0KCdsYWJlbC1zdWJ0cmVlLmh0bWwnKSk7XG4gICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFwcGVuZCgkY29tcGlsZShjb250ZW50KShzY29wZSkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSkge1xuICAgICAgICAgICAgICAgIC8vIG9wZW4gdGhlIHN1YnRyZWUgb2YgdGhpcyBpdGVtXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXRlbSBoYXMgY2hpbGRyZW5cbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNFeHBhbmRhYmxlID0gISEkc2NvcGUuY2F0ZWdvcmllc1RyZWVbJHNjb3BlLml0ZW0uaWRdO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXRlbSBpcyBjdXJyZW50bHkgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIC8vIHRoZSB1c2VyIGNsaWNrZWQgb24gdGhlICd4JyBidXR0b25cbiAgICAgICAgICAgICAgICAkc2NvcGUucmVtb3ZpbmcgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICRzY29wZS5zdGFydFJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlbW92aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmNhbmNlbFJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlbW92aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8vIGhhbmRsZSB0aGlzIGJ5IHRoZSBldmVudCByYXRoZXIgdGhhbiBhbiBvd24gY2xpY2sgaGFuZGxlciB0b1xuICAgICAgICAgICAgICAgIC8vIGRlYWwgd2l0aCBjbGljayBhbmQgc2VhcmNoIGZpZWxkIGFjdGlvbnMgaW4gYSB1bmlmaWVkIHdheVxuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ2NhdGVnb3JpZXMuc2VsZWN0ZWQnLCBmdW5jdGlvbiAoZSwgY2F0ZWdvcnlJZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBhbiBpdGVtIGlzIHNlbGVjdGVkLCBpdHMgc3VidHJlZSBhbmQgYWxsIHBhcmVudCBpdGVtc1xuICAgICAgICAgICAgICAgICAgICAvLyBzaG91bGQgYmUgb3BlbmVkXG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXRlbS5pZCA9PT0gY2F0ZWdvcnlJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIGhpdHMgYWxsIHBhcmVudCBzY29wZXMvaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kZW1pdCgnY2F0ZWdvcmllcy5vcGVuUGFyZW50cycpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gaWYgYSBjaGlsZCBpdGVtIHdhcyBzZWxlY3RlZCwgdGhpcyBpdGVtIHNob3VsZCBiZSBvcGVuZWQsIHRvb1xuICAgICAgICAgICAgICAgIC8vIHNvIHRoZSBzZWxlY3RlZCBpdGVtIGJlY29tZXMgdmlzaWJsZSBpbiB0aGUgdHJlZVxuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ2NhdGVnb3JpZXMub3BlblBhcmVudHMnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gc3RvcCBwcm9wYWdhdGlvbiBpZiB0aGlzIGlzIGEgcm9vdCBlbGVtZW50XG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXRlbS5wYXJlbnRfaWQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGNoZWNrLCBpZiBpdGVtIHN0aWxsIGhhcyBjaGlsZHJlblxuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ2NhdGVnb3JpZXMucmVmcmVzaCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc0V4cGFuZGFibGUgPSAhISRzY29wZS5jYXRlZ29yaWVzVHJlZVskc2NvcGUuaXRlbS5pZF07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBwcm9qZWN0TWVtYmVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIEEgcHJvamVjdCBtZW1iZXIgZWxlbWVudCBpbiB0aGUgcHJvamVjdCBtZW1iZXJzIG92ZXJ2aWV3LlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmRpcmVjdGl2ZSgncHJvamVjdE1lbWJlcicsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdDogJ0EnLFxuXG5cdFx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0XHRcdHZhciBkcmFnc3RhcnQgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdGUuZGF0YVRyYW5zZmVyLmVmZmVjdEFsbG93ZWQgPSAnbW92ZSc7XG4gIFx0XHRcdFx0XHRlLmRhdGFUcmFuc2Zlci5zZXREYXRhKCd0ZXh0L3BsYWluJywgc2NvcGUudXNlci5pZCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Ly8gZGlzYWJsZSBkcmFnZ2luZyB3aGVuIHJlbW92aW5nIGlzIGluIHByb2dyZXNzXG5cdFx0XHRcdHNjb3BlLiR3YXRjaCgncmVtb3ZpbmcnLCBmdW5jdGlvbiAocmVtb3ZpbmcpIHtcblx0XHRcdFx0XHRpZiAocmVtb3ZpbmcpIHtcblx0XHRcdFx0XHRcdGVsZW1lbnQub2ZmKCdkcmFnc3RhcnQnLCBkcmFnc3RhcnQpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRlbGVtZW50Lm9uKCdkcmFnc3RhcnQnLCBkcmFnc3RhcnQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0Ly8gd2hlbiBlZGl0aW5nIGlzIHN3aXRjaGVkIG9mZiwgcmVtb3ZpbmcgaXMgY2FuY2VsZWQsIHRvb1xuXHRcdFx0XHRzY29wZS4kd2F0Y2goJ2VkaXRpbmcnLCBmdW5jdGlvbiAoZWRpdGluZykge1xuXHRcdFx0XHRcdGlmICghZWRpdGluZykge1xuXHRcdFx0XHRcdFx0c2NvcGUuY2FuY2VsUmVtb3ZlKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0XHRcdFx0JHNjb3BlLnN0YXJ0UmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdCRzY29wZS5yZW1vdmluZyA9IHRydWU7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLmNhbmNlbFJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVtb3ZpbmcgPSBmYWxzZTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUucmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdCRzY29wZS5yZW1vdmVVc2VyKCRzY29wZS51c2VyLmlkKTtcblx0XHRcdFx0fTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9