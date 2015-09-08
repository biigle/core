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

//# sourceMappingURL=main.js.map