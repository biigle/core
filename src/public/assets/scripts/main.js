/**
 * @namespace dias.projects
 * @description The DIAS projects module.
 */
angular.module('dias.projects', ['dias.api', 'dias.ui']);

/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectDeleteController
 * @memberOf dias.projects
 * @description Initiates the deletion confirmation modal
 * @example

 */
angular.module('dias.projects').controller('ProjectDeleteController', ["$scope", "$uibModal", "$attrs", "msg", function ($scope, $uibModal, $attrs, msg) {
      "use strict";

      var success = function () {
         $scope.redirectToDashboard($attrs.successMsg);
      };

      var error = function () {
         msg.danger($attrs.errorMsg);
      };

      $scope.submit = function () {
         var modalInstance = $uibModal.open({
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
angular.module('dias.projects').controller('ProjectIndexController', ["$scope", "$attrs", "Project", "$uibModal", "ProjectUser", "msg", "$timeout", function ($scope, $attrs, Project, $uibModal, ProjectUser, msg, $timeout) {
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
         var modalInstance = $uibModal.open({
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

        var defaultLabelColor = '#0099ff';

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
            project_id: $scope.projectId,
            color: defaultLabelColor
        };

        // currently selected label
        $scope.selected = {
            label: null
        };

        $scope.resetColor = function () {
            $scope.newLabel.color = defaultLabelColor;
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
            }, msg.responseError);
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
angular.module('dias.projects').controller('ProjectMembersController', ["$scope", "Role", "ProjectUser", "msg", "$uibModal", function ($scope, Role, ProjectUser, msg, $uibModal) {
		"use strict";

		var getUser = function (id) {
			for (var i = $scope.users.length - 1; i >= 0; i--) {
				if ($scope.users[i].id == id) {
					return $scope.users[i];
				}
			}
		};

		var confirmChangeOwnRole = function (userId, role) {
			var modalInstance = $uibModal.open({
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9Qcm9qZWN0RGVsZXRlQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1Byb2plY3REZWxldGVNb2RhbENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Qcm9qZWN0SW5kZXhDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvUHJvamVjdEluZm9ybWF0aW9uQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1Byb2plY3RMYWJlbHNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvUHJvamVjdE1lbWJlcnNDb250YWluZXJDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvUHJvamVjdE1lbWJlcnNDb250cm9sbGVyLmpzIiwiZGlyZWN0aXZlcy9sYWJlbENhdGVnb3J5SXRlbS5qcyIsImRpcmVjdGl2ZXMvcHJvamVjdE1lbWJlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQUlBLFFBQUEsT0FBQSxpQkFBQSxDQUFBLFlBQUE7Ozs7Ozs7Ozs7O0FDS0EsUUFBQSxPQUFBLGlCQUFBLFdBQUEsb0VBQUEsVUFBQSxRQUFBLFdBQUEsUUFBQSxLQUFBO01BQ0E7O01BRUEsSUFBQSxVQUFBLFlBQUE7U0FDQSxPQUFBLG9CQUFBLE9BQUE7OztNQUdBLElBQUEsUUFBQSxZQUFBO1NBQ0EsSUFBQSxPQUFBLE9BQUE7OztNQUdBLE9BQUEsU0FBQSxZQUFBO1NBQ0EsSUFBQSxnQkFBQSxVQUFBLEtBQUE7WUFDQSxhQUFBO1lBQ0EsTUFBQTtZQUNBLFlBQUE7WUFDQSxPQUFBOzs7U0FHQSxjQUFBLE9BQUEsS0FBQSxVQUFBLFFBQUE7WUFDQSxRQUFBO2VBQ0EsS0FBQTtrQkFDQTtrQkFDQTtlQUNBLEtBQUE7a0JBQ0E7a0JBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7QUMxQkEsUUFBQSxPQUFBLGlCQUFBLFdBQUEsc0RBQUEsVUFBQSxRQUFBLFNBQUE7RUFDQTs7RUFFQSxPQUFBLFFBQUE7O0VBRUEsSUFBQSxnQkFBQSxV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QSxRQUFBO0VBQ0E7O0VBRUEsSUFBQSxXQUFBLFVBQUEsR0FBQTtHQUNBLE9BQUEsV0FBQTtHQUNBLE9BQUE7SUFDQSxFQUFBOzs7RUFHQSxJQUFBLFlBQUEsVUFBQSxHQUFBO0dBQ0EsT0FBQSxXQUFBO0dBQ0EsT0FBQTs7O0VBR0EsSUFBQSxPQUFBLFVBQUEsR0FBQTtHQUNBLE9BQUEsV0FBQTtHQUNBLE9BQUE7O0lBRUEsRUFBQSxhQUFBLFFBQUE7O0lBRUEsT0FBQTs7R0FFQSxPQUFBO0dBQ0EsRUFBQTs7OztFQUlBLE9BQUEsT0FBQSxXQUFBLFVBQUEsU0FBQTtHQUNBLElBQUEsU0FBQTtJQUNBLFNBQUEsR0FBQSxZQUFBO0lBQ0EsU0FBQSxHQUFBLGFBQUE7SUFDQSxTQUFBLEdBQUEsUUFBQTtVQUNBO0lBQ0EsU0FBQSxJQUFBLFlBQUE7SUFDQSxTQUFBLElBQUEsYUFBQTtJQUNBLFNBQUEsSUFBQSxRQUFBOzs7Ozs7Ozs7Ozs7O0FDbkNBLFFBQUEsT0FBQSxpQkFBQSxXQUFBLGtGQUFBLFVBQUEsUUFBQSxNQUFBLGFBQUEsS0FBQSxXQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBLFVBQUEsSUFBQTtHQUNBLEtBQUEsSUFBQSxJQUFBLE9BQUEsTUFBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7SUFDQSxJQUFBLE9BQUEsTUFBQSxHQUFBLE1BQUEsSUFBQTtLQUNBLE9BQUEsT0FBQSxNQUFBOzs7OztFQUtBLElBQUEsdUJBQUEsVUFBQSxRQUFBLE1BQUE7R0FDQSxJQUFBLGdCQUFBLFVBQUEsS0FBQTtJQUNBLGFBQUE7SUFDQSxNQUFBOzs7R0FHQSxjQUFBLE9BQUEsS0FBQSxVQUFBLFFBQUE7SUFDQSxJQUFBLFVBQUEsT0FBQTtLQUNBLE9BQUEsZUFBQSxRQUFBLE1BQUE7Ozs7O0VBS0EsS0FBQSxNQUFBLFVBQUEsWUFBQTtHQUNBLE9BQUEsUUFBQTtHQUNBLEtBQUEsSUFBQSxJQUFBLFdBQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO0lBQ0EsT0FBQSxNQUFBLFdBQUEsR0FBQSxRQUFBLFdBQUEsR0FBQTs7OztFQUlBLE9BQUEsUUFBQSxZQUFBLE1BQUEsRUFBQSxZQUFBLE9BQUE7O0VBRUEsT0FBQSxPQUFBLFlBQUE7R0FDQSxPQUFBLFVBQUEsQ0FBQSxPQUFBOzs7RUFHQSxPQUFBLFVBQUEsVUFBQSxNQUFBOztHQUVBLElBQUEsU0FBQSxPQUFBLE1BQUE7O0dBRUEsSUFBQSxVQUFBLFlBQUE7SUFDQSxLQUFBLGtCQUFBO0lBQ0EsT0FBQSxNQUFBLEtBQUE7Ozs7R0FJQSxJQUFBLENBQUEsUUFBQSxLQUFBLEtBQUE7SUFDQSxZQUFBO0tBQ0EsQ0FBQSxZQUFBLE9BQUE7S0FDQSxDQUFBLElBQUEsS0FBQSxJQUFBLGlCQUFBO0tBQ0EsU0FBQSxJQUFBOzs7OztFQUtBLE9BQUEsaUJBQUEsVUFBQSxRQUFBLE1BQUEsT0FBQTtHQUNBLElBQUEsQ0FBQSxTQUFBLFVBQUEsT0FBQSxXQUFBO0lBQ0EscUJBQUEsUUFBQTtJQUNBOzs7R0FHQSxJQUFBLE9BQUEsUUFBQTtHQUNBLElBQUEsU0FBQSxPQUFBLE1BQUE7OztHQUdBLElBQUEsS0FBQSxtQkFBQSxRQUFBO0lBQ0E7OztHQUdBLElBQUEsVUFBQSxZQUFBO0lBQ0EsS0FBQSxrQkFBQTs7O0dBR0EsWUFBQTtJQUNBLENBQUEsWUFBQSxPQUFBO0lBQ0EsQ0FBQSxJQUFBLEtBQUEsSUFBQSxpQkFBQTtJQUNBLFNBQUEsSUFBQTs7OztFQUlBLE9BQUEsYUFBQSxVQUFBLFFBQUE7O0dBRUEsSUFBQSxVQUFBLE9BQUEsV0FBQTtJQUNBLE9BQUE7SUFDQTs7O0dBR0EsSUFBQSxVQUFBLFlBQUE7SUFDQSxJQUFBOztJQUVBLEtBQUEsSUFBQSxJQUFBLE9BQUEsTUFBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7S0FDQSxJQUFBLE9BQUEsTUFBQSxHQUFBLE1BQUEsUUFBQTtNQUNBLFFBQUE7TUFDQTs7OztJQUlBLE9BQUEsTUFBQSxPQUFBLE9BQUE7OztHQUdBLFlBQUE7SUFDQSxDQUFBLFlBQUEsT0FBQTtJQUNBLENBQUEsSUFBQTtJQUNBLFNBQUEsSUFBQTs7Ozs7Ozs7Ozs7OztBQ3hHQSxRQUFBLE9BQUEsaUJBQUEsVUFBQSx1RUFBQSxVQUFBLFVBQUEsVUFBQSxnQkFBQTtRQUNBOztRQUVBLE9BQUE7WUFDQSxVQUFBOztZQUVBLGFBQUE7O1lBRUEsT0FBQTs7WUFFQSxNQUFBLFVBQUEsT0FBQSxTQUFBLE9BQUE7Ozs7Z0JBSUEsSUFBQSxVQUFBLFFBQUEsUUFBQSxlQUFBLElBQUE7Z0JBQ0EsU0FBQSxZQUFBO29CQUNBLFFBQUEsT0FBQSxTQUFBLFNBQUE7Ozs7WUFJQSx1QkFBQSxVQUFBLFFBQUE7O2dCQUVBLE9BQUEsU0FBQTs7Z0JBRUEsT0FBQSxlQUFBLENBQUEsQ0FBQSxPQUFBLGVBQUEsT0FBQSxLQUFBOztnQkFFQSxPQUFBLGFBQUE7O2dCQUVBLE9BQUEsV0FBQTs7Z0JBRUEsT0FBQSxjQUFBLFlBQUE7b0JBQ0EsT0FBQSxXQUFBOzs7Z0JBR0EsT0FBQSxlQUFBLFlBQUE7b0JBQ0EsT0FBQSxXQUFBOzs7OztnQkFLQSxPQUFBLElBQUEsdUJBQUEsVUFBQSxHQUFBLFlBQUE7OztvQkFHQSxJQUFBLE9BQUEsS0FBQSxPQUFBLFlBQUE7d0JBQ0EsT0FBQSxTQUFBO3dCQUNBLE9BQUEsYUFBQTs7d0JBRUEsT0FBQSxNQUFBOzJCQUNBO3dCQUNBLE9BQUEsU0FBQTt3QkFDQSxPQUFBLGFBQUE7Ozs7OztnQkFNQSxPQUFBLElBQUEsMEJBQUEsVUFBQSxHQUFBO29CQUNBLE9BQUEsU0FBQTs7b0JBRUEsSUFBQSxPQUFBLEtBQUEsY0FBQSxNQUFBO3dCQUNBLEVBQUE7Ozs7O2dCQUtBLE9BQUEsSUFBQSxzQkFBQSxVQUFBLEdBQUE7b0JBQ0EsT0FBQSxlQUFBLENBQUEsQ0FBQSxPQUFBLGVBQUEsT0FBQSxLQUFBOzs7Ozs7Ozs7Ozs7OztBQ2xFQSxRQUFBLE9BQUEsaUJBQUEsVUFBQSxpQkFBQSxZQUFBO0VBQ0E7O0VBRUEsT0FBQTtHQUNBLFVBQUE7O0dBRUEsTUFBQSxVQUFBLE9BQUEsU0FBQSxPQUFBO0lBQ0EsSUFBQSxZQUFBLFVBQUEsR0FBQTtLQUNBLEVBQUEsYUFBQSxnQkFBQTtPQUNBLEVBQUEsYUFBQSxRQUFBLGNBQUEsTUFBQSxLQUFBOzs7O0lBSUEsTUFBQSxPQUFBLFlBQUEsVUFBQSxVQUFBO0tBQ0EsSUFBQSxVQUFBO01BQ0EsUUFBQSxJQUFBLGFBQUE7WUFDQTtNQUNBLFFBQUEsR0FBQSxhQUFBOzs7OztJQUtBLE1BQUEsT0FBQSxXQUFBLFVBQUEsU0FBQTtLQUNBLElBQUEsQ0FBQSxTQUFBO01BQ0EsTUFBQTs7Ozs7R0FLQSx1QkFBQSxVQUFBLFFBQUE7SUFDQSxPQUFBLGNBQUEsWUFBQTtLQUNBLE9BQUEsV0FBQTs7O0lBR0EsT0FBQSxlQUFBLFlBQUE7S0FDQSxPQUFBLFdBQUE7OztJQUdBLE9BQUEsU0FBQSxZQUFBO0tBQ0EsT0FBQSxXQUFBLE9BQUEsS0FBQTs7Ozs7O0FBTUEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgcHJvamVjdHMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycsIFsnZGlhcy5hcGknLCAnZGlhcy51aSddKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdERlbGV0ZUNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSW5pdGlhdGVzIHRoZSBkZWxldGlvbiBjb25maXJtYXRpb24gbW9kYWxcbiAqIEBleGFtcGxlXG5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0RGVsZXRlQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbCwgJGF0dHJzLCBtc2cpIHtcbiAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICB2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICRzY29wZS5yZWRpcmVjdFRvRGFzaGJvYXJkKCRhdHRycy5zdWNjZXNzTXNnKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBlcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgIG1zZy5kYW5nZXIoJGF0dHJzLmVycm9yTXNnKTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5zdWJtaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICB2YXIgbW9kYWxJbnN0YW5jZSA9ICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnY29uZmlybURlbGV0ZU1vZGFsLmh0bWwnLFxuICAgICAgICAgICAgc2l6ZTogJ3NtJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdQcm9qZWN0RGVsZXRlTW9kYWxDb250cm9sbGVyJyxcbiAgICAgICAgICAgIHNjb3BlOiAkc2NvcGVcbiAgICAgICAgIH0pO1xuXG4gICAgICAgICBtb2RhbEluc3RhbmNlLnJlc3VsdC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHN3aXRjaCAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICBjYXNlICdzdWNjZXNzJzpcbiAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MoKTtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgY2FzZSAnZXJyb3InOlxuICAgICAgICAgICAgICAgICAgZXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgfSk7XG4gICAgICB9O1xuICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdERlbGV0ZU1vZGFsQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIHRoZSBjb25maXJtYXRpb24gb2YgZGVsZXRpb24gb2YgYSBwcm9qZWN0LlxuICogQGV4YW1wbGVcblxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3REZWxldGVNb2RhbENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBQcm9qZWN0KSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUuZm9yY2UgPSBmYWxzZTtcblxuXHRcdHZhciBkZWxldGVTdWNjZXNzID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHQkc2NvcGUuJGNsb3NlKCdzdWNjZXNzJyk7XG5cdFx0fTtcblxuXHRcdHZhciBkZWxldGVFcnJvciA9IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDApIHtcblx0XHRcdFx0JHNjb3BlLmZvcmNlID0gdHJ1ZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS4kY2xvc2UoJ2Vycm9yJyk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS5kZWxldGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgcGFyYW1zID0gJHNjb3BlLmZvcmNlID8ge2ZvcmNlOiB0cnVlfSA6IHt9O1xuXHRcdFx0JHNjb3BlLnByb2plY3QuJGRlbGV0ZShwYXJhbXMsIGRlbGV0ZVN1Y2Nlc3MsIGRlbGV0ZUVycm9yKTtcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBQcm9qZWN0SW5kZXhDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIFJvb3QgY29udHJvbGxlciBvZiB0aGUgcHJvamVjdCBpbmRleCBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3RJbmRleENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkYXR0cnMsIFByb2plY3QsICR1aWJNb2RhbCwgUHJvamVjdFVzZXIsIG1zZywgJHRpbWVvdXQpIHtcbiAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICB2YXIgbGVhdmluZ1N1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAkc2NvcGUucmVkaXJlY3RUb0Rhc2hib2FyZCgkYXR0cnMubGVhdmluZ1N1Y2Nlc3NNc2cpO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLnJlZGlyZWN0VG9EYXNoYm9hcmQgPSBmdW5jdGlvbiAobWVzc2FnZSwgdHlwZSkge1xuICAgICAgICAgdHlwZSA9IHR5cGUgfHwgJ3N1Y2Nlc3MnO1xuICAgICAgICAgbXNnLnBvc3QodHlwZSwgbWVzc2FnZSk7XG4gICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICRhdHRycy5kYXNoYm9hcmRVcmw7XG4gICAgICAgICB9LCAyMDAwKTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5wcm9qZWN0ID0gUHJvamVjdC5nZXQoe2lkOiAkYXR0cnMucHJvamVjdElkfSk7XG5cbiAgICAgICRzY29wZS5wcm9qZWN0SWQgPSAkYXR0cnMucHJvamVjdElkO1xuXG4gICAgICAkc2NvcGUub3duVXNlcklkID0gJGF0dHJzLnVzZXJJZDtcblxuICAgICAgJHNjb3BlLmxlYXZlUHJvamVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgIHZhciBtb2RhbEluc3RhbmNlID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdjb25maXJtTGVhdmVQcm9qZWN0TW9kYWwuaHRtbCcsXG4gICAgICAgICAgICBzaXplOiAnc20nXG4gICAgICAgICB9KTtcblxuICAgICAgICAgbW9kYWxJbnN0YW5jZS5yZXN1bHQudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICBpZiAocmVzdWx0ID09ICd5ZXMnKSB7XG4gICAgICAgICAgICAgICBQcm9qZWN0VXNlci5kZXRhY2goe3Byb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0LmlkfSwge2lkOiAkc2NvcGUub3duVXNlcklkfSwgbGVhdmluZ1N1Y2Nlc3MsIG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgIH0pO1xuICAgICAgfTtcbiAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFByb2plY3RJbmZvcm1hdGlvbkNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSGFuZGxlcyBtb2RpZmljYXRpb24gb2YgdGhlIGluZm9ybWF0aW9uIG9mIGEgcHJvamVjdC5cbiAqIEBleGFtcGxlXG5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0SW5mb3JtYXRpb25Db250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXHRcdFxuXHRcdCRzY29wZS5lZGl0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLmVkaXRpbmcgPSAhJHNjb3BlLmVkaXRpbmc7XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdExhYmVsc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSGFuZGxlcyBtb2RpZmljYXRpb24gb2YgdGhlIGxhYmVscyBvZiBhIHByb2plY3QuXG4gKiBAZXhhbXBsZVxuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJykuY29udHJvbGxlcignUHJvamVjdExhYmVsc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBQcm9qZWN0TGFiZWwsIExhYmVsLCBtc2cpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgZGVmYXVsdExhYmVsQ29sb3IgPSAnIzAwOTlmZic7XG5cbiAgICAgICAgdmFyIGJ1aWxkVHJlZSA9IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgdmFyIHBhcmVudCA9IGxhYmVsLnBhcmVudF9pZDtcbiAgICAgICAgICAgIGlmICgkc2NvcGUuY2F0ZWdvcmllc1RyZWVbcGFyZW50XSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5jYXRlZ29yaWVzVHJlZVtwYXJlbnRdLnB1c2gobGFiZWwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY2F0ZWdvcmllc1RyZWVbcGFyZW50XSA9IFtsYWJlbF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHJlZnJlc2hMYWJlbHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUubGFiZWxzID0gUHJvamVjdExhYmVsLnF1ZXJ5KHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdElkfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5jYXRlZ29yaWVzVHJlZSA9IHt9O1xuICAgICAgICAgICAgICAgICRzY29wZS5sYWJlbHMuZm9yRWFjaChidWlsZFRyZWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmVmcmVzaExhYmVscygpO1xuXG4gICAgICAgIC8vIGxhYmVsIHRoYXQgc2hvdWxkIGJlIG5ld2x5IGNyZWF0ZWQgb24gc3VibWl0XG4gICAgICAgICRzY29wZS5uZXdMYWJlbCA9IHtcbiAgICAgICAgICAgIHBhcmVudF9pZDogbnVsbCxcbiAgICAgICAgICAgIG5hbWU6IG51bGwsXG4gICAgICAgICAgICBwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdElkLFxuICAgICAgICAgICAgY29sb3I6IGRlZmF1bHRMYWJlbENvbG9yXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gY3VycmVudGx5IHNlbGVjdGVkIGxhYmVsXG4gICAgICAgICRzY29wZS5zZWxlY3RlZCA9IHtcbiAgICAgICAgICAgIGxhYmVsOiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnJlc2V0Q29sb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUubmV3TGFiZWwuY29sb3IgPSBkZWZhdWx0TGFiZWxDb2xvcjtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZWRpdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lZGl0aW5nID0gISRzY29wZS5lZGl0aW5nO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zZWxlY3RJdGVtID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZC5sYWJlbCA9IGl0ZW07XG4gICAgICAgICAgICAkc2NvcGUubmV3TGFiZWwucGFyZW50X2lkID0gaXRlbSA/IGl0ZW0uaWQgOiBudWxsO1xuICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ2NhdGVnb3JpZXMuc2VsZWN0ZWQnLCAkc2NvcGUubmV3TGFiZWwucGFyZW50X2lkKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUucmVtb3ZlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICAvLyBhbHdheXMgdXNlIGZvcmNlIGhlcmUgYmVjYXVzZSB0aGUgdXNlciBhbHJlYWR5IGhhZCB0byBjb25maXJtIGRlbGV0aW9uXG4gICAgICAgICAgICBMYWJlbC5kZWxldGUoe2lkOiBpZCwgZm9yY2U6IHRydWV9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCRzY29wZS5zZWxlY3RlZC5sYWJlbC5pZCA9PT0gaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdEl0ZW0obnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlZnJlc2hMYWJlbHMoKTtcbiAgICAgICAgICAgIH0sIG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuYWRkTGFiZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBMYWJlbC5hZGQoJHNjb3BlLm5ld0xhYmVsLCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUubGFiZWxzLnB1c2gocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIGJ1aWxkVHJlZShyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ2NhdGVnb3JpZXMucmVmcmVzaCcpO1xuICAgICAgICAgICAgICAgICRzY29wZS5uZXdMYWJlbC5uYW1lID0gJyc7XG4gICAgICAgICAgICB9LCBtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgIH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFByb2plY3RNZW1iZXJzQ29udGFpbmVyQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBDb250YWlucyBwcm9qZWN0IG1lbWJlcnMgb2YgYSBjZXJ0YWluIHJvbGUuIE5ldyBtZW1iZXJzIGNhbiBiZSBkcm9wcGVkIGluLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3RNZW1iZXJzQ29udGFpbmVyQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBkcmFnb3ZlciA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHQkc2NvcGUuaG92ZXJpbmcgPSB0cnVlO1xuXHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0IGUucHJldmVudERlZmF1bHQoKTtcblx0XHR9O1xuXG5cdFx0dmFyIGRyYWdsZWF2ZSA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHQkc2NvcGUuaG92ZXJpbmcgPSBmYWxzZTtcblx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHR9O1xuXG5cdFx0dmFyIGRyb3AgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0JHNjb3BlLmhvdmVyaW5nID0gZmFsc2U7XG5cdFx0XHQkc2NvcGUuY2hhbmdlVXNlclJvbGUoXG5cdFx0XHRcdC8vIHVzZXIgaWRcblx0XHRcdFx0ZS5kYXRhVHJhbnNmZXIuZ2V0RGF0YSgndGV4dC9wbGFpbicpLFxuXHRcdFx0XHQvLyBuZXcgcm9sZSBuYW1lXG5cdFx0XHRcdCRhdHRycy5yb2xlXG5cdFx0XHQpO1xuXHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH07XG5cblx0XHQvLyBvbmx5IGFsbG93IGRyb3BwaW5nIGlmIGVkaXRpbmdcblx0XHQkc2NvcGUuJHdhdGNoKCdlZGl0aW5nJywgZnVuY3Rpb24gKGVkaXRpbmcpIHtcblx0XHRcdGlmIChlZGl0aW5nKSB7XG5cdFx0XHRcdCRlbGVtZW50Lm9uKCdkcmFnb3ZlcicsIGRyYWdvdmVyKTtcblx0XHRcdFx0JGVsZW1lbnQub24oJ2RyYWdsZWF2ZScsIGRyYWdsZWF2ZSk7XG5cdFx0XHRcdCRlbGVtZW50Lm9uKCdkcm9wJywgZHJvcCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkZWxlbWVudC5vZmYoJ2RyYWdvdmVyJywgZHJhZ292ZXIpO1xuXHRcdFx0XHQkZWxlbWVudC5vZmYoJ2RyYWdsZWF2ZScsIGRyYWdsZWF2ZSk7XG5cdFx0XHRcdCRlbGVtZW50Lm9mZignZHJvcCcsIGRyb3ApO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBQcm9qZWN0TWVtYmVyc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSGFuZGxlcyBtb2RpZmljYXRpb24gb2YgdGhlIG1lbWJlcnMgb2YgYSBwcm9qZWN0LlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3RNZW1iZXJzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIFJvbGUsIFByb2plY3RVc2VyLCBtc2csICR1aWJNb2RhbCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIGdldFVzZXIgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdGZvciAodmFyIGkgPSAkc2NvcGUudXNlcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdFx0aWYgKCRzY29wZS51c2Vyc1tpXS5pZCA9PSBpZCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUudXNlcnNbaV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dmFyIGNvbmZpcm1DaGFuZ2VPd25Sb2xlID0gZnVuY3Rpb24gKHVzZXJJZCwgcm9sZSkge1xuXHRcdFx0dmFyIG1vZGFsSW5zdGFuY2UgPSAkdWliTW9kYWwub3Blbih7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnY29uZmlybUNoYW5nZVJvbGVNb2RhbC5odG1sJyxcblx0XHRcdFx0c2l6ZTogJ3NtJ1xuXHRcdFx0fSk7XG5cblx0XHRcdG1vZGFsSW5zdGFuY2UucmVzdWx0LnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuXHRcdFx0XHRpZiAocmVzdWx0ID09ICd5ZXMnKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNoYW5nZVVzZXJSb2xlKHVzZXJJZCwgcm9sZSwgdHJ1ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHRSb2xlLnF1ZXJ5KGZ1bmN0aW9uIChyb2xlc0FycmF5KSB7XG5cdFx0XHQkc2NvcGUucm9sZXMgPSB7fTtcblx0XHRcdGZvciAodmFyIGkgPSByb2xlc0FycmF5Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRcdCRzY29wZS5yb2xlc1tyb2xlc0FycmF5W2ldLm5hbWVdID0gcm9sZXNBcnJheVtpXS5pZDtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdCRzY29wZS51c2VycyA9IFByb2plY3RVc2VyLnF1ZXJ5KHsgcHJvamVjdF9pZDogJHNjb3BlLnByb2plY3RJZCB9KTtcblxuXHRcdCRzY29wZS5lZGl0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLmVkaXRpbmcgPSAhJHNjb3BlLmVkaXRpbmc7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5hZGRVc2VyID0gZnVuY3Rpb24gKHVzZXIpIHtcblx0XHRcdC8vIG5ldyB1c2VycyBhcmUgZ3Vlc3RzIGJ5IGRlZmF1bHRcblx0XHRcdHZhciByb2xlSWQgPSAkc2NvcGUucm9sZXMuZ3Vlc3Q7XG5cblx0XHRcdHZhciBzdWNjZXNzID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHR1c2VyLnByb2plY3Rfcm9sZV9pZCA9IHJvbGVJZDtcblx0XHRcdFx0JHNjb3BlLnVzZXJzLnB1c2godXNlcik7XG5cdFx0XHR9O1xuXG5cdFx0XHQvLyB1c2VyIHNob3VsZG4ndCBhbHJlYWR5IGV4aXN0XG5cdFx0XHRpZiAoIWdldFVzZXIodXNlci5pZCkpIHtcblx0XHRcdFx0UHJvamVjdFVzZXIuYXR0YWNoKFxuXHRcdFx0XHRcdHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdElkfSxcblx0XHRcdFx0XHR7aWQ6IHVzZXIuaWQsIHByb2plY3Rfcm9sZV9pZDogcm9sZUlkfSxcblx0XHRcdFx0XHRzdWNjZXNzLCBtc2cucmVzcG9uc2VFcnJvclxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQkc2NvcGUuY2hhbmdlVXNlclJvbGUgPSBmdW5jdGlvbiAodXNlcklkLCByb2xlLCBmb3JjZSkge1xuXHRcdFx0aWYgKCFmb3JjZSAmJiB1c2VySWQgPT0gJHNjb3BlLm93blVzZXJJZCkge1xuXHRcdFx0XHRjb25maXJtQ2hhbmdlT3duUm9sZSh1c2VySWQsIHJvbGUpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHZhciB1c2VyID0gZ2V0VXNlcih1c2VySWQpO1xuXHRcdFx0dmFyIHJvbGVJZCA9ICRzY29wZS5yb2xlc1tyb2xlXTtcblxuXHRcdFx0Ly8gbm8gYWN0aW9uIHJlcXVpcmVkXG5cdFx0XHRpZiAodXNlci5wcm9qZWN0X3JvbGVfaWQgPT0gcm9sZUlkKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHVzZXIucHJvamVjdF9yb2xlX2lkID0gcm9sZUlkO1xuXHRcdFx0fTtcblxuXHRcdFx0UHJvamVjdFVzZXIuc2F2ZShcblx0XHRcdFx0e3Byb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0SWR9LFxuXHRcdFx0XHR7aWQ6IHVzZXIuaWQsIHByb2plY3Rfcm9sZV9pZDogcm9sZUlkfSxcblx0XHRcdFx0c3VjY2VzcywgbXNnLnJlc3BvbnNlRXJyb3Jcblx0XHRcdCk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5yZW1vdmVVc2VyID0gZnVuY3Rpb24gKHVzZXJJZCkge1xuXHRcdFx0Ly8gbGVhdmluZyB0aGUgcHJvamVjdCB3aWxsIGJlIGhhbmRsZWQgYnkgcGFyZW50IGNvbnRyb2xsZXJcblx0XHRcdGlmICh1c2VySWQgPT0gJHNjb3BlLm93blVzZXJJZCkge1xuXHRcdFx0XHQkc2NvcGUubGVhdmVQcm9qZWN0KCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHZhciBpbmRleDtcblxuXHRcdFx0XHRmb3IgKHZhciBpID0gJHNjb3BlLnVzZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRcdFx0aWYgKCRzY29wZS51c2Vyc1tpXS5pZCA9PSB1c2VySWQpIHtcblx0XHRcdFx0XHRcdGluZGV4ID0gaTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdCRzY29wZS51c2Vycy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0fTtcblxuXHRcdFx0UHJvamVjdFVzZXIuZGV0YWNoKFxuXHRcdFx0XHR7cHJvamVjdF9pZDogJHNjb3BlLnByb2plY3RJZH0sXG5cdFx0XHRcdHtpZDogdXNlcklkfSxcblx0XHRcdFx0c3VjY2VzcywgbXNnLnJlc3BvbnNlRXJyb3Jcblx0XHRcdCk7XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBwcm9qZWN0TGFiZWxDYXRlZ29yeUl0ZW1cbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gQSBsYWJlbCBjYXRlZ29yeSBsaXN0IGl0ZW0uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJykuZGlyZWN0aXZlKCdwcm9qZWN0TGFiZWxDYXRlZ29yeUl0ZW0nLCBmdW5jdGlvbiAoJGNvbXBpbGUsICR0aW1lb3V0LCAkdGVtcGxhdGVDYWNoZSkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdDJyxcblxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdsYWJlbC1pdGVtLmh0bWwnLFxuXG4gICAgICAgICAgICBzY29wZTogdHJ1ZSxcblxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgICAgIC8vIHdhaXQgZm9yIHRoaXMgZWxlbWVudCB0byBiZSByZW5kZXJlZCB1bnRpbCB0aGUgY2hpbGRyZW4gYXJlXG4gICAgICAgICAgICAgICAgLy8gYXBwZW5kZWQsIG90aGVyd2lzZSB0aGVyZSB3b3VsZCBiZSB0b28gbXVjaCByZWN1cnNpb24gZm9yXG4gICAgICAgICAgICAgICAgLy8gYW5ndWxhclxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldCgnbGFiZWwtc3VidHJlZS5odG1sJykpO1xuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQoJGNvbXBpbGUoY29udGVudCkoc2NvcGUpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvcGVuIHRoZSBzdWJ0cmVlIG9mIHRoaXMgaXRlbVxuICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaGFzIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzRXhwYW5kYWJsZSA9ICEhJHNjb3BlLmNhdGVnb3JpZXNUcmVlWyRzY29wZS5pdGVtLmlkXTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaXMgY3VycmVudGx5IHNlbGVjdGVkXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyB0aGUgdXNlciBjbGlja2VkIG9uIHRoZSAneCcgYnV0dG9uXG4gICAgICAgICAgICAgICAgJHNjb3BlLnJlbW92aW5nID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAkc2NvcGUuc3RhcnRSZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5yZW1vdmluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICRzY29wZS5jYW5jZWxSZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5yZW1vdmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvLyBoYW5kbGUgdGhpcyBieSB0aGUgZXZlbnQgcmF0aGVyIHRoYW4gYW4gb3duIGNsaWNrIGhhbmRsZXIgdG9cbiAgICAgICAgICAgICAgICAvLyBkZWFsIHdpdGggY2xpY2sgYW5kIHNlYXJjaCBmaWVsZCBhY3Rpb25zIGluIGEgdW5pZmllZCB3YXlcbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdjYXRlZ29yaWVzLnNlbGVjdGVkJywgZnVuY3Rpb24gKGUsIGNhdGVnb3J5SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgYW4gaXRlbSBpcyBzZWxlY3RlZCwgaXRzIHN1YnRyZWUgYW5kIGFsbCBwYXJlbnQgaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgLy8gc2hvdWxkIGJlIG9wZW5lZFxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLml0ZW0uaWQgPT09IGNhdGVnb3J5SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyBoaXRzIGFsbCBwYXJlbnQgc2NvcGVzL2l0ZW1zXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2NhdGVnb3JpZXMub3BlblBhcmVudHMnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1NlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGlmIGEgY2hpbGQgaXRlbSB3YXMgc2VsZWN0ZWQsIHRoaXMgaXRlbSBzaG91bGQgYmUgb3BlbmVkLCB0b29cbiAgICAgICAgICAgICAgICAvLyBzbyB0aGUgc2VsZWN0ZWQgaXRlbSBiZWNvbWVzIHZpc2libGUgaW4gdGhlIHRyZWVcbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdjYXRlZ29yaWVzLm9wZW5QYXJlbnRzJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIHN0b3AgcHJvcGFnYXRpb24gaWYgdGhpcyBpcyBhIHJvb3QgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLml0ZW0ucGFyZW50X2lkID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBjaGVjaywgaWYgaXRlbSBzdGlsbCBoYXMgY2hpbGRyZW5cbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdjYXRlZ29yaWVzLnJlZnJlc2gnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNFeHBhbmRhYmxlID0gISEkc2NvcGUuY2F0ZWdvcmllc1RyZWVbJHNjb3BlLml0ZW0uaWRdO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgcHJvamVjdE1lbWJlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBBIHByb2plY3QgbWVtYmVyIGVsZW1lbnQgaW4gdGhlIHByb2plY3QgbWVtYmVycyBvdmVydmlldy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5kaXJlY3RpdmUoJ3Byb2plY3RNZW1iZXInLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3Q6ICdBJyxcblxuXHRcdFx0bGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdFx0XHR2YXIgZHJhZ3N0YXJ0ID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0XHRlLmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gJ21vdmUnO1xuICBcdFx0XHRcdFx0ZS5kYXRhVHJhbnNmZXIuc2V0RGF0YSgndGV4dC9wbGFpbicsIHNjb3BlLnVzZXIuaWQpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdC8vIGRpc2FibGUgZHJhZ2dpbmcgd2hlbiByZW1vdmluZyBpcyBpbiBwcm9ncmVzc1xuXHRcdFx0XHRzY29wZS4kd2F0Y2goJ3JlbW92aW5nJywgZnVuY3Rpb24gKHJlbW92aW5nKSB7XG5cdFx0XHRcdFx0aWYgKHJlbW92aW5nKSB7XG5cdFx0XHRcdFx0XHRlbGVtZW50Lm9mZignZHJhZ3N0YXJ0JywgZHJhZ3N0YXJ0KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5vbignZHJhZ3N0YXJ0JywgZHJhZ3N0YXJ0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdC8vIHdoZW4gZWRpdGluZyBpcyBzd2l0Y2hlZCBvZmYsIHJlbW92aW5nIGlzIGNhbmNlbGVkLCB0b29cblx0XHRcdFx0c2NvcGUuJHdhdGNoKCdlZGl0aW5nJywgZnVuY3Rpb24gKGVkaXRpbmcpIHtcblx0XHRcdFx0XHRpZiAoIWVkaXRpbmcpIHtcblx0XHRcdFx0XHRcdHNjb3BlLmNhbmNlbFJlbW92ZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9LFxuXHRcdFx0XG5cdFx0XHRjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlKSB7XG5cdFx0XHRcdCRzY29wZS5zdGFydFJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVtb3ZpbmcgPSB0cnVlO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRzY29wZS5jYW5jZWxSZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJlbW92aW5nID0gZmFsc2U7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVtb3ZlVXNlcigkc2NvcGUudXNlci5pZCk7XG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==