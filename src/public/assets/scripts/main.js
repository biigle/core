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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9Qcm9qZWN0RGVsZXRlQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1Byb2plY3REZWxldGVNb2RhbENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Qcm9qZWN0SW5kZXhDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvUHJvamVjdEluZm9ybWF0aW9uQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1Byb2plY3RMYWJlbHNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvUHJvamVjdE1lbWJlcnNDb250YWluZXJDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvUHJvamVjdE1lbWJlcnNDb250cm9sbGVyLmpzIiwiZGlyZWN0aXZlcy9sYWJlbENhdGVnb3J5SXRlbS5qcyIsImRpcmVjdGl2ZXMvcHJvamVjdE1lbWJlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQUlBLFFBQUEsT0FBQSxpQkFBQSxDQUFBLFlBQUE7Ozs7Ozs7Ozs7O0FDS0EsUUFBQSxPQUFBLGlCQUFBLFdBQUEsb0VBQUEsVUFBQSxRQUFBLFdBQUEsUUFBQSxLQUFBO01BQ0E7O01BRUEsSUFBQSxVQUFBLFlBQUE7U0FDQSxPQUFBLG9CQUFBLE9BQUE7OztNQUdBLElBQUEsUUFBQSxZQUFBO1NBQ0EsSUFBQSxPQUFBLE9BQUE7OztNQUdBLE9BQUEsU0FBQSxZQUFBO1NBQ0EsSUFBQSxnQkFBQSxVQUFBLEtBQUE7WUFDQSxhQUFBO1lBQ0EsTUFBQTtZQUNBLFlBQUE7WUFDQSxPQUFBOzs7U0FHQSxjQUFBLE9BQUEsS0FBQSxVQUFBLFFBQUE7WUFDQSxRQUFBO2VBQ0EsS0FBQTtrQkFDQTtrQkFDQTtlQUNBLEtBQUE7a0JBQ0E7a0JBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7QUMxQkEsUUFBQSxPQUFBLGlCQUFBLFdBQUEsc0RBQUEsVUFBQSxRQUFBLFNBQUE7RUFDQTs7RUFFQSxPQUFBLFFBQUE7O0VBRUEsSUFBQSxnQkFBQSxVQUFBLFVBQUE7R0FDQSxPQUFBLE9BQUE7OztFQUdBLElBQUEsY0FBQSxTQUFBLFVBQUE7R0FDQSxJQUFBLFNBQUEsV0FBQSxLQUFBO0lBQ0EsT0FBQSxRQUFBO1VBQ0E7SUFDQSxPQUFBLE9BQUE7Ozs7RUFJQSxPQUFBLFNBQUEsWUFBQTtHQUNBLElBQUEsU0FBQSxPQUFBLFFBQUEsQ0FBQSxPQUFBLFFBQUE7R0FDQSxPQUFBLFFBQUEsUUFBQSxRQUFBLGVBQUE7Ozs7Ozs7Ozs7OztBQ3JCQSxRQUFBLE9BQUEsaUJBQUEsV0FBQSx5R0FBQSxVQUFBLFFBQUEsUUFBQSxTQUFBLFdBQUEsYUFBQSxLQUFBLFVBQUE7TUFDQTs7TUFFQSxJQUFBLGlCQUFBLFlBQUE7U0FDQSxPQUFBLG9CQUFBLE9BQUE7OztNQUdBLE9BQUEsc0JBQUEsVUFBQSxTQUFBLE1BQUE7U0FDQSxPQUFBLFFBQUE7U0FDQSxJQUFBLEtBQUEsTUFBQTtTQUNBLFNBQUEsWUFBQTtZQUNBLE9BQUEsU0FBQSxPQUFBLE9BQUE7WUFDQTs7O01BR0EsT0FBQSxVQUFBLFFBQUEsSUFBQSxDQUFBLElBQUEsT0FBQTs7TUFFQSxPQUFBLFlBQUEsT0FBQTs7TUFFQSxPQUFBLFlBQUEsT0FBQTs7TUFFQSxPQUFBLGVBQUEsWUFBQTtTQUNBLElBQUEsZ0JBQUEsVUFBQSxLQUFBO1lBQ0EsYUFBQTtZQUNBLE1BQUE7OztTQUdBLGNBQUEsT0FBQSxLQUFBLFVBQUEsUUFBQTtZQUNBLElBQUEsVUFBQSxPQUFBO2VBQ0EsWUFBQSxPQUFBLENBQUEsWUFBQSxPQUFBLFFBQUEsS0FBQSxDQUFBLElBQUEsT0FBQSxZQUFBLGdCQUFBLElBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7QUMzQkEsUUFBQSxPQUFBLGlCQUFBLFdBQUEsMkNBQUEsVUFBQSxRQUFBO0VBQ0E7O0VBRUEsT0FBQSxPQUFBLFlBQUE7R0FDQSxPQUFBLFVBQUEsQ0FBQSxPQUFBOzs7Ozs7Ozs7Ozs7OztBQ0pBLFFBQUEsT0FBQSxpQkFBQSxXQUFBLHNFQUFBLFVBQUEsUUFBQSxjQUFBLE9BQUEsS0FBQTtFQUNBOztRQUVBLElBQUEsWUFBQSxVQUFBLE9BQUE7WUFDQSxJQUFBLFNBQUEsTUFBQTtZQUNBLElBQUEsT0FBQSxlQUFBLFNBQUE7Z0JBQ0EsT0FBQSxlQUFBLFFBQUEsS0FBQTttQkFDQTtnQkFDQSxPQUFBLGVBQUEsVUFBQSxDQUFBOzs7O1FBSUEsSUFBQSxnQkFBQSxZQUFBO1lBQ0EsT0FBQSxTQUFBLGFBQUEsTUFBQSxDQUFBLFlBQUEsT0FBQSxZQUFBLFlBQUE7Z0JBQ0EsT0FBQSxpQkFBQTtnQkFDQSxPQUFBLE9BQUEsUUFBQTs7OztRQUlBOzs7UUFHQSxPQUFBLFdBQUE7WUFDQSxXQUFBO1lBQ0EsTUFBQTtZQUNBLFlBQUEsT0FBQTs7OztRQUlBLE9BQUEsV0FBQTtZQUNBLE9BQUE7OztRQUdBLE9BQUEsT0FBQSxZQUFBO1lBQ0EsT0FBQSxVQUFBLENBQUEsT0FBQTs7O1FBR0EsT0FBQSxhQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUEsU0FBQSxRQUFBO1lBQ0EsT0FBQSxTQUFBLFlBQUEsT0FBQSxLQUFBLEtBQUE7WUFDQSxPQUFBLFdBQUEsdUJBQUEsT0FBQSxTQUFBOzs7UUFHQSxPQUFBLFNBQUEsVUFBQSxJQUFBOztZQUVBLE1BQUEsT0FBQSxDQUFBLElBQUEsSUFBQSxPQUFBLE9BQUEsWUFBQTtnQkFDQSxJQUFBLE9BQUEsU0FBQSxNQUFBLE9BQUEsSUFBQTtvQkFDQSxPQUFBLFdBQUE7O2dCQUVBOzs7O1FBSUEsT0FBQSxXQUFBLFlBQUE7WUFDQSxNQUFBLElBQUEsT0FBQSxVQUFBLFVBQUEsVUFBQTtnQkFDQSxPQUFBLE9BQUEsS0FBQTtnQkFDQSxVQUFBO2dCQUNBLE9BQUEsV0FBQTtnQkFDQSxPQUFBLFNBQUEsT0FBQTtlQUNBLElBQUE7Ozs7Ozs7Ozs7OztBQzdEQSxRQUFBLE9BQUEsaUJBQUEsV0FBQSxzRUFBQSxVQUFBLFFBQUEsVUFBQSxRQUFBO0VBQ0E7O0VBRUEsSUFBQSxXQUFBLFVBQUEsR0FBQTtHQUNBLE9BQUEsV0FBQTtHQUNBLE9BQUE7SUFDQSxFQUFBOzs7RUFHQSxJQUFBLFlBQUEsVUFBQSxHQUFBO0dBQ0EsT0FBQSxXQUFBO0dBQ0EsT0FBQTs7O0VBR0EsSUFBQSxPQUFBLFVBQUEsR0FBQTtHQUNBLE9BQUEsV0FBQTtHQUNBLE9BQUE7O0lBRUEsRUFBQSxhQUFBLFFBQUE7O0lBRUEsT0FBQTs7R0FFQSxPQUFBO0dBQ0EsRUFBQTs7OztFQUlBLE9BQUEsT0FBQSxXQUFBLFVBQUEsU0FBQTtHQUNBLElBQUEsU0FBQTtJQUNBLFNBQUEsR0FBQSxZQUFBO0lBQ0EsU0FBQSxHQUFBLGFBQUE7SUFDQSxTQUFBLEdBQUEsUUFBQTtVQUNBO0lBQ0EsU0FBQSxJQUFBLFlBQUE7SUFDQSxTQUFBLElBQUEsYUFBQTtJQUNBLFNBQUEsSUFBQSxRQUFBOzs7Ozs7Ozs7Ozs7O0FDbkNBLFFBQUEsT0FBQSxpQkFBQSxXQUFBLGtGQUFBLFVBQUEsUUFBQSxNQUFBLGFBQUEsS0FBQSxXQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBLFVBQUEsSUFBQTtHQUNBLEtBQUEsSUFBQSxJQUFBLE9BQUEsTUFBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7SUFDQSxJQUFBLE9BQUEsTUFBQSxHQUFBLE1BQUEsSUFBQTtLQUNBLE9BQUEsT0FBQSxNQUFBOzs7OztFQUtBLElBQUEsdUJBQUEsVUFBQSxRQUFBLE1BQUE7R0FDQSxJQUFBLGdCQUFBLFVBQUEsS0FBQTtJQUNBLGFBQUE7SUFDQSxNQUFBOzs7R0FHQSxjQUFBLE9BQUEsS0FBQSxVQUFBLFFBQUE7SUFDQSxJQUFBLFVBQUEsT0FBQTtLQUNBLE9BQUEsZUFBQSxRQUFBLE1BQUE7Ozs7O0VBS0EsS0FBQSxNQUFBLFVBQUEsWUFBQTtHQUNBLE9BQUEsUUFBQTtHQUNBLEtBQUEsSUFBQSxJQUFBLFdBQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO0lBQ0EsT0FBQSxNQUFBLFdBQUEsR0FBQSxRQUFBLFdBQUEsR0FBQTs7OztFQUlBLE9BQUEsUUFBQSxZQUFBLE1BQUEsRUFBQSxZQUFBLE9BQUE7O0VBRUEsT0FBQSxPQUFBLFlBQUE7R0FDQSxPQUFBLFVBQUEsQ0FBQSxPQUFBOzs7RUFHQSxPQUFBLFVBQUEsVUFBQSxNQUFBOztHQUVBLElBQUEsU0FBQSxPQUFBLE1BQUE7O0dBRUEsSUFBQSxVQUFBLFlBQUE7SUFDQSxLQUFBLGtCQUFBO0lBQ0EsT0FBQSxNQUFBLEtBQUE7Ozs7R0FJQSxJQUFBLENBQUEsUUFBQSxLQUFBLEtBQUE7SUFDQSxZQUFBO0tBQ0EsQ0FBQSxZQUFBLE9BQUE7S0FDQSxDQUFBLElBQUEsS0FBQSxJQUFBLGlCQUFBO0tBQ0EsU0FBQSxJQUFBOzs7OztFQUtBLE9BQUEsaUJBQUEsVUFBQSxRQUFBLE1BQUEsT0FBQTtHQUNBLElBQUEsQ0FBQSxTQUFBLFVBQUEsT0FBQSxXQUFBO0lBQ0EscUJBQUEsUUFBQTtJQUNBOzs7R0FHQSxJQUFBLE9BQUEsUUFBQTtHQUNBLElBQUEsU0FBQSxPQUFBLE1BQUE7OztHQUdBLElBQUEsS0FBQSxtQkFBQSxRQUFBO0lBQ0E7OztHQUdBLElBQUEsVUFBQSxZQUFBO0lBQ0EsS0FBQSxrQkFBQTs7O0dBR0EsWUFBQTtJQUNBLENBQUEsWUFBQSxPQUFBO0lBQ0EsQ0FBQSxJQUFBLEtBQUEsSUFBQSxpQkFBQTtJQUNBLFNBQUEsSUFBQTs7OztFQUlBLE9BQUEsYUFBQSxVQUFBLFFBQUE7O0dBRUEsSUFBQSxVQUFBLE9BQUEsV0FBQTtJQUNBLE9BQUE7SUFDQTs7O0dBR0EsSUFBQSxVQUFBLFlBQUE7SUFDQSxJQUFBOztJQUVBLEtBQUEsSUFBQSxJQUFBLE9BQUEsTUFBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7S0FDQSxJQUFBLE9BQUEsTUFBQSxHQUFBLE1BQUEsUUFBQTtNQUNBLFFBQUE7TUFDQTs7OztJQUlBLE9BQUEsTUFBQSxPQUFBLE9BQUE7OztHQUdBLFlBQUE7SUFDQSxDQUFBLFlBQUEsT0FBQTtJQUNBLENBQUEsSUFBQTtJQUNBLFNBQUEsSUFBQTs7Ozs7Ozs7Ozs7OztBQ3hHQSxRQUFBLE9BQUEsaUJBQUEsVUFBQSx1RUFBQSxVQUFBLFVBQUEsVUFBQSxnQkFBQTtRQUNBOztRQUVBLE9BQUE7WUFDQSxVQUFBOztZQUVBLGFBQUE7O1lBRUEsT0FBQTs7WUFFQSxNQUFBLFVBQUEsT0FBQSxTQUFBLE9BQUE7Ozs7Z0JBSUEsSUFBQSxVQUFBLFFBQUEsUUFBQSxlQUFBLElBQUE7Z0JBQ0EsU0FBQSxZQUFBO29CQUNBLFFBQUEsT0FBQSxTQUFBLFNBQUE7Ozs7WUFJQSx1QkFBQSxVQUFBLFFBQUE7O2dCQUVBLE9BQUEsU0FBQTs7Z0JBRUEsT0FBQSxlQUFBLENBQUEsQ0FBQSxPQUFBLGVBQUEsT0FBQSxLQUFBOztnQkFFQSxPQUFBLGFBQUE7O2dCQUVBLE9BQUEsV0FBQTs7Z0JBRUEsT0FBQSxjQUFBLFlBQUE7b0JBQ0EsT0FBQSxXQUFBOzs7Z0JBR0EsT0FBQSxlQUFBLFlBQUE7b0JBQ0EsT0FBQSxXQUFBOzs7OztnQkFLQSxPQUFBLElBQUEsdUJBQUEsVUFBQSxHQUFBLFlBQUE7OztvQkFHQSxJQUFBLE9BQUEsS0FBQSxPQUFBLFlBQUE7d0JBQ0EsT0FBQSxTQUFBO3dCQUNBLE9BQUEsYUFBQTs7d0JBRUEsT0FBQSxNQUFBOzJCQUNBO3dCQUNBLE9BQUEsU0FBQTt3QkFDQSxPQUFBLGFBQUE7Ozs7OztnQkFNQSxPQUFBLElBQUEsMEJBQUEsVUFBQSxHQUFBO29CQUNBLE9BQUEsU0FBQTs7b0JBRUEsSUFBQSxPQUFBLEtBQUEsY0FBQSxNQUFBO3dCQUNBLEVBQUE7Ozs7O2dCQUtBLE9BQUEsSUFBQSxzQkFBQSxVQUFBLEdBQUE7b0JBQ0EsT0FBQSxlQUFBLENBQUEsQ0FBQSxPQUFBLGVBQUEsT0FBQSxLQUFBOzs7Ozs7Ozs7Ozs7OztBQ2xFQSxRQUFBLE9BQUEsaUJBQUEsVUFBQSxpQkFBQSxZQUFBO0VBQ0E7O0VBRUEsT0FBQTtHQUNBLFVBQUE7O0dBRUEsTUFBQSxVQUFBLE9BQUEsU0FBQSxPQUFBO0lBQ0EsSUFBQSxZQUFBLFVBQUEsR0FBQTtLQUNBLEVBQUEsYUFBQSxnQkFBQTtPQUNBLEVBQUEsYUFBQSxRQUFBLGNBQUEsTUFBQSxLQUFBOzs7O0lBSUEsTUFBQSxPQUFBLFlBQUEsVUFBQSxVQUFBO0tBQ0EsSUFBQSxVQUFBO01BQ0EsUUFBQSxJQUFBLGFBQUE7WUFDQTtNQUNBLFFBQUEsR0FBQSxhQUFBOzs7OztJQUtBLE1BQUEsT0FBQSxXQUFBLFVBQUEsU0FBQTtLQUNBLElBQUEsQ0FBQSxTQUFBO01BQ0EsTUFBQTs7Ozs7R0FLQSx1QkFBQSxVQUFBLFFBQUE7SUFDQSxPQUFBLGNBQUEsWUFBQTtLQUNBLE9BQUEsV0FBQTs7O0lBR0EsT0FBQSxlQUFBLFlBQUE7S0FDQSxPQUFBLFdBQUE7OztJQUdBLE9BQUEsU0FBQSxZQUFBO0tBQ0EsT0FBQSxXQUFBLE9BQUEsS0FBQTs7Ozs7O0FBTUEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgcHJvamVjdHMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycsIFsnZGlhcy5hcGknLCAnZGlhcy51aSddKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdERlbGV0ZUNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSW5pdGlhdGVzIHRoZSBkZWxldGlvbiBjb25maXJtYXRpb24gbW9kYWxcbiAqIEBleGFtcGxlXG5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0RGVsZXRlQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbCwgJGF0dHJzLCBtc2cpIHtcbiAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICB2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICRzY29wZS5yZWRpcmVjdFRvRGFzaGJvYXJkKCRhdHRycy5zdWNjZXNzTXNnKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBlcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgIG1zZy5kYW5nZXIoJGF0dHJzLmVycm9yTXNnKTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5zdWJtaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICB2YXIgbW9kYWxJbnN0YW5jZSA9ICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnY29uZmlybURlbGV0ZU1vZGFsLmh0bWwnLFxuICAgICAgICAgICAgc2l6ZTogJ3NtJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdQcm9qZWN0RGVsZXRlTW9kYWxDb250cm9sbGVyJyxcbiAgICAgICAgICAgIHNjb3BlOiAkc2NvcGVcbiAgICAgICAgIH0pO1xuXG4gICAgICAgICBtb2RhbEluc3RhbmNlLnJlc3VsdC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHN3aXRjaCAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICBjYXNlICdzdWNjZXNzJzpcbiAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MoKTtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgY2FzZSAnZXJyb3InOlxuICAgICAgICAgICAgICAgICAgZXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgfSk7XG4gICAgICB9O1xuICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdERlbGV0ZU1vZGFsQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIHRoZSBjb25maXJtYXRpb24gb2YgZGVsZXRpb24gb2YgYSBwcm9qZWN0LlxuICogQGV4YW1wbGVcblxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3REZWxldGVNb2RhbENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBQcm9qZWN0KSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUuZm9yY2UgPSBmYWxzZTtcblxuXHRcdHZhciBkZWxldGVTdWNjZXNzID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHQkc2NvcGUuJGNsb3NlKCdzdWNjZXNzJyk7XG5cdFx0fTtcblxuXHRcdHZhciBkZWxldGVFcnJvciA9IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDApIHtcblx0XHRcdFx0JHNjb3BlLmZvcmNlID0gdHJ1ZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS4kY2xvc2UoJ2Vycm9yJyk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS5kZWxldGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgcGFyYW1zID0gJHNjb3BlLmZvcmNlID8ge2ZvcmNlOiB0cnVlfSA6IHt9O1xuXHRcdFx0JHNjb3BlLnByb2plY3QuJGRlbGV0ZShwYXJhbXMsIGRlbGV0ZVN1Y2Nlc3MsIGRlbGV0ZUVycm9yKTtcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBQcm9qZWN0SW5kZXhDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIFJvb3QgY29udHJvbGxlciBvZiB0aGUgcHJvamVjdCBpbmRleCBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmNvbnRyb2xsZXIoJ1Byb2plY3RJbmRleENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkYXR0cnMsIFByb2plY3QsICR1aWJNb2RhbCwgUHJvamVjdFVzZXIsIG1zZywgJHRpbWVvdXQpIHtcbiAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICB2YXIgbGVhdmluZ1N1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAkc2NvcGUucmVkaXJlY3RUb0Rhc2hib2FyZCgkYXR0cnMubGVhdmluZ1N1Y2Nlc3NNc2cpO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLnJlZGlyZWN0VG9EYXNoYm9hcmQgPSBmdW5jdGlvbiAobWVzc2FnZSwgdHlwZSkge1xuICAgICAgICAgdHlwZSA9IHR5cGUgfHwgJ3N1Y2Nlc3MnO1xuICAgICAgICAgbXNnLnBvc3QodHlwZSwgbWVzc2FnZSk7XG4gICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICRhdHRycy5kYXNoYm9hcmRVcmw7XG4gICAgICAgICB9LCAyMDAwKTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5wcm9qZWN0ID0gUHJvamVjdC5nZXQoe2lkOiAkYXR0cnMucHJvamVjdElkfSk7XG5cbiAgICAgICRzY29wZS5wcm9qZWN0SWQgPSAkYXR0cnMucHJvamVjdElkO1xuXG4gICAgICAkc2NvcGUub3duVXNlcklkID0gJGF0dHJzLnVzZXJJZDtcblxuICAgICAgJHNjb3BlLmxlYXZlUHJvamVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgIHZhciBtb2RhbEluc3RhbmNlID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdjb25maXJtTGVhdmVQcm9qZWN0TW9kYWwuaHRtbCcsXG4gICAgICAgICAgICBzaXplOiAnc20nXG4gICAgICAgICB9KTtcblxuICAgICAgICAgbW9kYWxJbnN0YW5jZS5yZXN1bHQudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICBpZiAocmVzdWx0ID09ICd5ZXMnKSB7XG4gICAgICAgICAgICAgICBQcm9qZWN0VXNlci5kZXRhY2goe3Byb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0LmlkfSwge2lkOiAkc2NvcGUub3duVXNlcklkfSwgbGVhdmluZ1N1Y2Nlc3MsIG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgIH0pO1xuICAgICAgfTtcbiAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFByb2plY3RJbmZvcm1hdGlvbkNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSGFuZGxlcyBtb2RpZmljYXRpb24gb2YgdGhlIGluZm9ybWF0aW9uIG9mIGEgcHJvamVjdC5cbiAqIEBleGFtcGxlXG5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5jb250cm9sbGVyKCdQcm9qZWN0SW5mb3JtYXRpb25Db250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXHRcdFxuXHRcdCRzY29wZS5lZGl0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLmVkaXRpbmcgPSAhJHNjb3BlLmVkaXRpbmc7XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdExhYmVsc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gSGFuZGxlcyBtb2RpZmljYXRpb24gb2YgdGhlIGxhYmVscyBvZiBhIHByb2plY3QuXG4gKiBAZXhhbXBsZVxuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJykuY29udHJvbGxlcignUHJvamVjdExhYmVsc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBQcm9qZWN0TGFiZWwsIExhYmVsLCBtc2cpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgYnVpbGRUcmVlID0gZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gbGFiZWwucGFyZW50X2lkO1xuICAgICAgICAgICAgaWYgKCRzY29wZS5jYXRlZ29yaWVzVHJlZVtwYXJlbnRdKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXNUcmVlW3BhcmVudF0ucHVzaChsYWJlbCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzY29wZS5jYXRlZ29yaWVzVHJlZVtwYXJlbnRdID0gW2xhYmVsXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcmVmcmVzaExhYmVscyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5sYWJlbHMgPSBQcm9qZWN0TGFiZWwucXVlcnkoe3Byb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0SWR9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXNUcmVlID0ge307XG4gICAgICAgICAgICAgICAgJHNjb3BlLmxhYmVscy5mb3JFYWNoKGJ1aWxkVHJlZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICByZWZyZXNoTGFiZWxzKCk7XG5cbiAgICAgICAgLy8gbGFiZWwgdGhhdCBzaG91bGQgYmUgbmV3bHkgY3JlYXRlZCBvbiBzdWJtaXRcbiAgICAgICAgJHNjb3BlLm5ld0xhYmVsID0ge1xuICAgICAgICAgICAgcGFyZW50X2lkOiBudWxsLFxuICAgICAgICAgICAgbmFtZTogbnVsbCxcbiAgICAgICAgICAgIHByb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0SWRcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBjdXJyZW50bHkgc2VsZWN0ZWQgbGFiZWxcbiAgICAgICAgJHNjb3BlLnNlbGVjdGVkID0ge1xuICAgICAgICAgICAgbGFiZWw6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZWRpdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lZGl0aW5nID0gISRzY29wZS5lZGl0aW5nO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zZWxlY3RJdGVtID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZC5sYWJlbCA9IGl0ZW07XG4gICAgICAgICAgICAkc2NvcGUubmV3TGFiZWwucGFyZW50X2lkID0gaXRlbSA/IGl0ZW0uaWQgOiBudWxsO1xuICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ2NhdGVnb3JpZXMuc2VsZWN0ZWQnLCAkc2NvcGUubmV3TGFiZWwucGFyZW50X2lkKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUucmVtb3ZlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICAvLyBhbHdheXMgdXNlIGZvcmNlIGhlcmUgYmVjYXVzZSB0aGUgdXNlciBhbHJlYWR5IGhhZCB0byBjb25maXJtIGRlbGV0aW9uXG4gICAgICAgICAgICBMYWJlbC5kZWxldGUoe2lkOiBpZCwgZm9yY2U6IHRydWV9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCRzY29wZS5zZWxlY3RlZC5sYWJlbC5pZCA9PT0gaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdEl0ZW0obnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlZnJlc2hMYWJlbHMoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5hZGRMYWJlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIExhYmVsLmFkZCgkc2NvcGUubmV3TGFiZWwsIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5sYWJlbHMucHVzaChyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgYnVpbGRUcmVlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnY2F0ZWdvcmllcy5yZWZyZXNoJyk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLm5ld0xhYmVsLm5hbWUgPSAnJztcbiAgICAgICAgICAgIH0sIG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgfTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgUHJvamVjdE1lbWJlcnNDb250YWluZXJDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIENvbnRhaW5zIHByb2plY3QgbWVtYmVycyBvZiBhIGNlcnRhaW4gcm9sZS4gTmV3IG1lbWJlcnMgY2FuIGJlIGRyb3BwZWQgaW4uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJykuY29udHJvbGxlcignUHJvamVjdE1lbWJlcnNDb250YWluZXJDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQsICRhdHRycykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIGRyYWdvdmVyID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdCRzY29wZS5ob3ZlcmluZyA9IHRydWU7XG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0XHQgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH07XG5cblx0XHR2YXIgZHJhZ2xlYXZlID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdCRzY29wZS5ob3ZlcmluZyA9IGZhbHNlO1xuXHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdH07XG5cblx0XHR2YXIgZHJvcCA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHQkc2NvcGUuaG92ZXJpbmcgPSBmYWxzZTtcblx0XHRcdCRzY29wZS5jaGFuZ2VVc2VyUm9sZShcblx0XHRcdFx0Ly8gdXNlciBpZFxuXHRcdFx0XHRlLmRhdGFUcmFuc2Zlci5nZXREYXRhKCd0ZXh0L3BsYWluJyksXG5cdFx0XHRcdC8vIG5ldyByb2xlIG5hbWVcblx0XHRcdFx0JGF0dHJzLnJvbGVcblx0XHRcdCk7XG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fTtcblxuXHRcdC8vIG9ubHkgYWxsb3cgZHJvcHBpbmcgaWYgZWRpdGluZ1xuXHRcdCRzY29wZS4kd2F0Y2goJ2VkaXRpbmcnLCBmdW5jdGlvbiAoZWRpdGluZykge1xuXHRcdFx0aWYgKGVkaXRpbmcpIHtcblx0XHRcdFx0JGVsZW1lbnQub24oJ2RyYWdvdmVyJywgZHJhZ292ZXIpO1xuXHRcdFx0XHQkZWxlbWVudC5vbignZHJhZ2xlYXZlJywgZHJhZ2xlYXZlKTtcblx0XHRcdFx0JGVsZW1lbnQub24oJ2Ryb3AnLCBkcm9wKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRlbGVtZW50Lm9mZignZHJhZ292ZXInLCBkcmFnb3Zlcik7XG5cdFx0XHRcdCRlbGVtZW50Lm9mZignZHJhZ2xlYXZlJywgZHJhZ2xlYXZlKTtcblx0XHRcdFx0JGVsZW1lbnQub2ZmKCdkcm9wJywgZHJvcCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5wcm9qZWN0c1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFByb2plY3RNZW1iZXJzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBIYW5kbGVzIG1vZGlmaWNhdGlvbiBvZiB0aGUgbWVtYmVycyBvZiBhIHByb2plY3QuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLnByb2plY3RzJykuY29udHJvbGxlcignUHJvamVjdE1lbWJlcnNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgUm9sZSwgUHJvamVjdFVzZXIsIG1zZywgJHVpYk1vZGFsKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgZ2V0VXNlciA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0Zm9yICh2YXIgaSA9ICRzY29wZS51c2Vycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdFx0XHRpZiAoJHNjb3BlLnVzZXJzW2ldLmlkID09IGlkKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRzY29wZS51c2Vyc1tpXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR2YXIgY29uZmlybUNoYW5nZU93blJvbGUgPSBmdW5jdGlvbiAodXNlcklkLCByb2xlKSB7XG5cdFx0XHR2YXIgbW9kYWxJbnN0YW5jZSA9ICR1aWJNb2RhbC5vcGVuKHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICdjb25maXJtQ2hhbmdlUm9sZU1vZGFsLmh0bWwnLFxuXHRcdFx0XHRzaXplOiAnc20nXG5cdFx0XHR9KTtcblxuXHRcdFx0bW9kYWxJbnN0YW5jZS5yZXN1bHQudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG5cdFx0XHRcdGlmIChyZXN1bHQgPT0gJ3llcycpIHtcblx0XHRcdFx0XHQkc2NvcGUuY2hhbmdlVXNlclJvbGUodXNlcklkLCByb2xlLCB0cnVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdFJvbGUucXVlcnkoZnVuY3Rpb24gKHJvbGVzQXJyYXkpIHtcblx0XHRcdCRzY29wZS5yb2xlcyA9IHt9O1xuXHRcdFx0Zm9yICh2YXIgaSA9IHJvbGVzQXJyYXkubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdFx0JHNjb3BlLnJvbGVzW3JvbGVzQXJyYXlbaV0ubmFtZV0gPSByb2xlc0FycmF5W2ldLmlkO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLnVzZXJzID0gUHJvamVjdFVzZXIucXVlcnkoeyBwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdElkIH0pO1xuXG5cdFx0JHNjb3BlLmVkaXQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUuZWRpdGluZyA9ICEkc2NvcGUuZWRpdGluZztcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmFkZFVzZXIgPSBmdW5jdGlvbiAodXNlcikge1xuXHRcdFx0Ly8gbmV3IHVzZXJzIGFyZSBndWVzdHMgYnkgZGVmYXVsdFxuXHRcdFx0dmFyIHJvbGVJZCA9ICRzY29wZS5yb2xlcy5ndWVzdDtcblxuXHRcdFx0dmFyIHN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHVzZXIucHJvamVjdF9yb2xlX2lkID0gcm9sZUlkO1xuXHRcdFx0XHQkc2NvcGUudXNlcnMucHVzaCh1c2VyKTtcblx0XHRcdH07XG5cblx0XHRcdC8vIHVzZXIgc2hvdWxkbid0IGFscmVhZHkgZXhpc3Rcblx0XHRcdGlmICghZ2V0VXNlcih1c2VyLmlkKSkge1xuXHRcdFx0XHRQcm9qZWN0VXNlci5hdHRhY2goXG5cdFx0XHRcdFx0e3Byb2plY3RfaWQ6ICRzY29wZS5wcm9qZWN0SWR9LFxuXHRcdFx0XHRcdHtpZDogdXNlci5pZCwgcHJvamVjdF9yb2xlX2lkOiByb2xlSWR9LFxuXHRcdFx0XHRcdHN1Y2Nlc3MsIG1zZy5yZXNwb25zZUVycm9yXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS5jaGFuZ2VVc2VyUm9sZSA9IGZ1bmN0aW9uICh1c2VySWQsIHJvbGUsIGZvcmNlKSB7XG5cdFx0XHRpZiAoIWZvcmNlICYmIHVzZXJJZCA9PSAkc2NvcGUub3duVXNlcklkKSB7XG5cdFx0XHRcdGNvbmZpcm1DaGFuZ2VPd25Sb2xlKHVzZXJJZCwgcm9sZSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHVzZXIgPSBnZXRVc2VyKHVzZXJJZCk7XG5cdFx0XHR2YXIgcm9sZUlkID0gJHNjb3BlLnJvbGVzW3JvbGVdO1xuXG5cdFx0XHQvLyBubyBhY3Rpb24gcmVxdWlyZWRcblx0XHRcdGlmICh1c2VyLnByb2plY3Rfcm9sZV9pZCA9PSByb2xlSWQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0dXNlci5wcm9qZWN0X3JvbGVfaWQgPSByb2xlSWQ7XG5cdFx0XHR9O1xuXG5cdFx0XHRQcm9qZWN0VXNlci5zYXZlKFxuXHRcdFx0XHR7cHJvamVjdF9pZDogJHNjb3BlLnByb2plY3RJZH0sXG5cdFx0XHRcdHtpZDogdXNlci5pZCwgcHJvamVjdF9yb2xlX2lkOiByb2xlSWR9LFxuXHRcdFx0XHRzdWNjZXNzLCBtc2cucmVzcG9uc2VFcnJvclxuXHRcdFx0KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnJlbW92ZVVzZXIgPSBmdW5jdGlvbiAodXNlcklkKSB7XG5cdFx0XHQvLyBsZWF2aW5nIHRoZSBwcm9qZWN0IHdpbGwgYmUgaGFuZGxlZCBieSBwYXJlbnQgY29udHJvbGxlclxuXHRcdFx0aWYgKHVzZXJJZCA9PSAkc2NvcGUub3duVXNlcklkKSB7XG5cdFx0XHRcdCRzY29wZS5sZWF2ZVByb2plY3QoKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0dmFyIGluZGV4O1xuXG5cdFx0XHRcdGZvciAodmFyIGkgPSAkc2NvcGUudXNlcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdFx0XHRpZiAoJHNjb3BlLnVzZXJzW2ldLmlkID09IHVzZXJJZCkge1xuXHRcdFx0XHRcdFx0aW5kZXggPSBpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0JHNjb3BlLnVzZXJzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHR9O1xuXG5cdFx0XHRQcm9qZWN0VXNlci5kZXRhY2goXG5cdFx0XHRcdHtwcm9qZWN0X2lkOiAkc2NvcGUucHJvamVjdElkfSxcblx0XHRcdFx0e2lkOiB1c2VySWR9LFxuXHRcdFx0XHRzdWNjZXNzLCBtc2cucmVzcG9uc2VFcnJvclxuXHRcdFx0KTtcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIHByb2plY3RMYWJlbENhdGVnb3J5SXRlbVxuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBBIGxhYmVsIGNhdGVnb3J5IGxpc3QgaXRlbS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMucHJvamVjdHMnKS5kaXJlY3RpdmUoJ3Byb2plY3RMYWJlbENhdGVnb3J5SXRlbScsIGZ1bmN0aW9uICgkY29tcGlsZSwgJHRpbWVvdXQsICR0ZW1wbGF0ZUNhY2hlKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0MnLFxuXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2xhYmVsLWl0ZW0uaHRtbCcsXG5cbiAgICAgICAgICAgIHNjb3BlOiB0cnVlLFxuXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgLy8gd2FpdCBmb3IgdGhpcyBlbGVtZW50IHRvIGJlIHJlbmRlcmVkIHVudGlsIHRoZSBjaGlsZHJlbiBhcmVcbiAgICAgICAgICAgICAgICAvLyBhcHBlbmRlZCwgb3RoZXJ3aXNlIHRoZXJlIHdvdWxkIGJlIHRvbyBtdWNoIHJlY3Vyc2lvbiBmb3JcbiAgICAgICAgICAgICAgICAvLyBhbmd1bGFyXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSBhbmd1bGFyLmVsZW1lbnQoJHRlbXBsYXRlQ2FjaGUuZ2V0KCdsYWJlbC1zdWJ0cmVlLmh0bWwnKSk7XG4gICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFwcGVuZCgkY29tcGlsZShjb250ZW50KShzY29wZSkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSkge1xuICAgICAgICAgICAgICAgIC8vIG9wZW4gdGhlIHN1YnRyZWUgb2YgdGhpcyBpdGVtXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXRlbSBoYXMgY2hpbGRyZW5cbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNFeHBhbmRhYmxlID0gISEkc2NvcGUuY2F0ZWdvcmllc1RyZWVbJHNjb3BlLml0ZW0uaWRdO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXRlbSBpcyBjdXJyZW50bHkgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIC8vIHRoZSB1c2VyIGNsaWNrZWQgb24gdGhlICd4JyBidXR0b25cbiAgICAgICAgICAgICAgICAkc2NvcGUucmVtb3ZpbmcgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICRzY29wZS5zdGFydFJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlbW92aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmNhbmNlbFJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlbW92aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8vIGhhbmRsZSB0aGlzIGJ5IHRoZSBldmVudCByYXRoZXIgdGhhbiBhbiBvd24gY2xpY2sgaGFuZGxlciB0b1xuICAgICAgICAgICAgICAgIC8vIGRlYWwgd2l0aCBjbGljayBhbmQgc2VhcmNoIGZpZWxkIGFjdGlvbnMgaW4gYSB1bmlmaWVkIHdheVxuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ2NhdGVnb3JpZXMuc2VsZWN0ZWQnLCBmdW5jdGlvbiAoZSwgY2F0ZWdvcnlJZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBhbiBpdGVtIGlzIHNlbGVjdGVkLCBpdHMgc3VidHJlZSBhbmQgYWxsIHBhcmVudCBpdGVtc1xuICAgICAgICAgICAgICAgICAgICAvLyBzaG91bGQgYmUgb3BlbmVkXG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXRlbS5pZCA9PT0gY2F0ZWdvcnlJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIGhpdHMgYWxsIHBhcmVudCBzY29wZXMvaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kZW1pdCgnY2F0ZWdvcmllcy5vcGVuUGFyZW50cycpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gaWYgYSBjaGlsZCBpdGVtIHdhcyBzZWxlY3RlZCwgdGhpcyBpdGVtIHNob3VsZCBiZSBvcGVuZWQsIHRvb1xuICAgICAgICAgICAgICAgIC8vIHNvIHRoZSBzZWxlY3RlZCBpdGVtIGJlY29tZXMgdmlzaWJsZSBpbiB0aGUgdHJlZVxuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ2NhdGVnb3JpZXMub3BlblBhcmVudHMnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gc3RvcCBwcm9wYWdhdGlvbiBpZiB0aGlzIGlzIGEgcm9vdCBlbGVtZW50XG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXRlbS5wYXJlbnRfaWQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGNoZWNrLCBpZiBpdGVtIHN0aWxsIGhhcyBjaGlsZHJlblxuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ2NhdGVnb3JpZXMucmVmcmVzaCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc0V4cGFuZGFibGUgPSAhISRzY29wZS5jYXRlZ29yaWVzVHJlZVskc2NvcGUuaXRlbS5pZF07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBwcm9qZWN0TWVtYmVyXG4gKiBAbWVtYmVyT2YgZGlhcy5wcm9qZWN0c1xuICogQGRlc2NyaXB0aW9uIEEgcHJvamVjdCBtZW1iZXIgZWxlbWVudCBpbiB0aGUgcHJvamVjdCBtZW1iZXJzIG92ZXJ2aWV3LlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmRpcmVjdGl2ZSgncHJvamVjdE1lbWJlcicsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdDogJ0EnLFxuXG5cdFx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0XHRcdHZhciBkcmFnc3RhcnQgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdGUuZGF0YVRyYW5zZmVyLmVmZmVjdEFsbG93ZWQgPSAnbW92ZSc7XG4gIFx0XHRcdFx0XHRlLmRhdGFUcmFuc2Zlci5zZXREYXRhKCd0ZXh0L3BsYWluJywgc2NvcGUudXNlci5pZCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Ly8gZGlzYWJsZSBkcmFnZ2luZyB3aGVuIHJlbW92aW5nIGlzIGluIHByb2dyZXNzXG5cdFx0XHRcdHNjb3BlLiR3YXRjaCgncmVtb3ZpbmcnLCBmdW5jdGlvbiAocmVtb3ZpbmcpIHtcblx0XHRcdFx0XHRpZiAocmVtb3ZpbmcpIHtcblx0XHRcdFx0XHRcdGVsZW1lbnQub2ZmKCdkcmFnc3RhcnQnLCBkcmFnc3RhcnQpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRlbGVtZW50Lm9uKCdkcmFnc3RhcnQnLCBkcmFnc3RhcnQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0Ly8gd2hlbiBlZGl0aW5nIGlzIHN3aXRjaGVkIG9mZiwgcmVtb3ZpbmcgaXMgY2FuY2VsZWQsIHRvb1xuXHRcdFx0XHRzY29wZS4kd2F0Y2goJ2VkaXRpbmcnLCBmdW5jdGlvbiAoZWRpdGluZykge1xuXHRcdFx0XHRcdGlmICghZWRpdGluZykge1xuXHRcdFx0XHRcdFx0c2NvcGUuY2FuY2VsUmVtb3ZlKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0XHRcdFx0JHNjb3BlLnN0YXJ0UmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdCRzY29wZS5yZW1vdmluZyA9IHRydWU7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLmNhbmNlbFJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVtb3ZpbmcgPSBmYWxzZTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUucmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdCRzY29wZS5yZW1vdmVVc2VyKCRzY29wZS51c2VyLmlkKTtcblx0XHRcdFx0fTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG4pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9