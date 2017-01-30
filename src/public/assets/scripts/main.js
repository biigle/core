/**
 * @namespace biigle.label-trees
 * @description The BIIGLE label trees module.
 */
angular.module('biigle.label-trees', ['biigle.api', 'biigle.ui']);

/*
 * Disable debug info in production for better performance.
 * see: https://code.angularjs.org/1.4.7/docs/guide/production
 */
angular.module('biigle.label-trees').config(["$compileProvider", function ($compileProvider) {
    "use strict";

    $compileProvider.debugInfoEnabled(false);
}]);

/**
 * The panel for editing the labels of a label tree
 */
biigle.$viewModel('label-trees-labels', function (element) {
    var labels = biigle.$require('api.labels');
    var messages = biigle.$require('messages.store');
    var randomColor = biigle.$require('labelTrees.randomColor');
    var labelTree = biigle.$require('labelTrees.labelTree');

    new Vue({
        el: element,
        data: {
            editing: false,
            loading: false,
            labels: biigle.$require('labelTrees.labels'),
            selectedColor: randomColor(),
            selectedLabel: null,
            selectedName: '',
        },
        components: {
            typeahead: VueStrap.typeahead,
            tabs: VueStrap.tabs,
            tab: VueStrap.tab,
            labelTree: biigle.$require('labelTrees.components.labelTree'),
            manualLabelForm: biigle.$require('labelTrees.components.manualLabelForm'),
            wormsLabelForm: biigle.$require('labelTrees.components.wormsLabelForm'),
        },
        computed: {
            classObject: function () {
                return {
                    'panel-warning': this.editing
                };
            },
        },
        methods: {
            toggleEditing: function () {
                this.editing = !this.editing;
            },
            startLoading: function () {
                this.loading = true;
            },
            finishLoading: function () {
                this.loading = false;
            },
            deleteLabel: function (label) {
                var self = this;
                this.startLoading();
                labels.delete({id: label.id})
                    .then(function () {
                        self.labelDeleted(label);
                    }, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
            labelDeleted: function (label) {
                if (this.selectedLabel && this.selectedLabel.id === label.id) {
                    this.deselectLabel(label);
                }

                for (var i = this.labels.length - 1; i >= 0; i--) {
                    if (this.labels[i].id === label.id) {
                        this.labels.splice(i, 1);
                        break;
                    }
                }
            },
            selectLabel: function (label) {
                this.selectedLabel = label;
                if (!label) {
                    this.$emit('clear');
                } else {
                    this.selectedColor = '#' + label.color;
                    this.$emit('select', label);
                }
            },
            deselectLabel: function (label) {
                this.selectedLabel = null;
                this.$emit('deselect', label);
            },
            selectColor: function (color) {
                this.selectedColor = color;
            },
            selectName: function (name) {
                this.selectedName = name;
            },
            insertLabel: function (label) {
                Vue.set(label, 'open', false);
                Vue.set(label, 'selected', false);
                var name = label.name.toLowerCase();
                // add the label to the array so the labels remain sorted by their name
                for (var i = 0, length = this.labels.length; i < length; i++) {
                    if (this.labels[i].name.toLowerCase() >= name) {
                        this.labels.splice(i, 0, label);
                        return;
                    }
                }
                // If the function didn't return by now the label is "smaller" than all
                // the other labels.
                this.labels.push(label);
            },
            createLabel: function (label) {
                if (this.loading) {
                    return;
                }

                this.startLoading();
                labels.save({label_tree_id: labelTree.id}, label)
                    .then(this.labelCreated, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
            labelCreated: function (response) {
                response.data.forEach(this.insertLabel);
                this.selectedColor = randomColor();
                this.selectedName = '';
            }
        }
    });
});

/**
 * Function returning a random color
 */
biigle.$declare('labelTrees.randomColor', function () {
    // HSV values
    var MIN = [0, 0.5, 0.9];
    var MAX = [360, 1, 1];

    // number of decimals to keep
    var PRECISION = [0, 2, 2];

    // see https://de.wikipedia.org/wiki/HSV-Farbraum#Transformation_von_RGB_und_HSV.2FHSL
    var toRgb = function (hsv) {
        var tmp = hsv[0] / 60;
        var hi = Math.floor(tmp);
        var f = tmp - hi;
        var pqt = [
            hsv[2] * (1 - hsv[1]),
            hsv[2] * (1 - hsv[1] * f),
            hsv[2] * (1 - hsv[1] * (1 - f))
        ];

        var rgb;

        switch (hi) {
            case 1:
                rgb = [pqt[1], hsv[2], pqt[0]];
                break;
            case 2:
                rgb = [pqt[0], hsv[2], pqt[2]];
                break;
            case 3:
                rgb = [pqt[0], pqt[1], hsv[2]];
                break;
            case 4:
                rgb = [pqt[2], pqt[0], hsv[2]];
                break;
            case 5:
                rgb = [hsv[2], pqt[0], pqt[1]];
                break;
            default:
                rgb = [hsv[2], pqt[2], pqt[0]];
        }

        return rgb.map(function(item) {
            return Math.round(item * 255);
        });
    };

    var toHex = function (rgb) {
        return rgb.map(function (item) {
            item = item.toString(16);
            return (item.length === 1) ? ('0' + item) : item;
        });
    };

    return function () {
        var color = [0, 0, 0];
        var precision;
        for (var i = color.length - 1; i >= 0; i--) {
            precision = 10 * PRECISION[i];
            color[i] = (MAX[i] - MIN[i]) * Math.random() + MIN[i];
            if (precision !== 0) {
                color[i] = Math.round(color[i] * precision) / precision;
            } else {
                color[i] = Math.round(color[i]);
            }
        }

        return '#' + toHex(toRgb(color)).join('');
    };
});

/**
 * @namespace biigle.label-trees
 * @ngdoc controller
 * @name AuthorizedProjectsController
 * @memberOf biigle.label-trees
 * @description Controller for the the autorized projects of a label tree
 */
angular.module('biigle.label-trees').controller('AuthorizedProjectsController', ["$scope", "LABEL_TREE", "AUTH_PROJECTS", "AUTH_OWN_PROJECTS", "Project", "LabelTreeAuthorizedProject", function ($scope, LABEL_TREE, AUTH_PROJECTS, AUTH_OWN_PROJECTS, Project, LabelTreeAuthorizedProject) {
        "use strict";

        var editing = false;
        var loading = false;

        var ownProjects = null;

        // all projects the current user belongs to and that are not already authorized
        var projectsForAuthorization = null;

        var projectIsNotAuthorized = function (project) {
            for (var i = AUTH_PROJECTS.length - 1; i >= 0; i--) {
                if (AUTH_PROJECTS[i].id === project.id) {
                    return false;
                }
            }

            return true;
        };

        var updateProjectsForAuthorization = function (projects) {
            projectsForAuthorization = projects.filter(projectIsNotAuthorized);
        };

        var handleError = function (response) {
            msg.responseError(response);
            loading = false;
        };

        var projectAdded = function (project) {
            AUTH_PROJECTS.push(project);
            // user can only authorize own projects
            AUTH_OWN_PROJECTS.push(project.id);
            updateProjectsForAuthorization(ownProjects);
            loading = false;
        };

        var projectRemoved = function (project) {
            var i;
            for (i = AUTH_PROJECTS.length - 1; i >= 0; i--) {
                if (AUTH_PROJECTS[i].id === project.id) {
                    AUTH_PROJECTS.splice(i, 1);
                    break;
                }
            }

            i = AUTH_OWN_PROJECTS.indexOf(project.id);
            if (i !== -1) {
                AUTH_OWN_PROJECTS.splice(i, 1);
            }

            updateProjectsForAuthorization(ownProjects);
            loading = false;
        };

        $scope.hasProjects = function () {
            return AUTH_PROJECTS.length > 0;
        };

        $scope.getProjects = function () {
            return AUTH_PROJECTS;
        };

        $scope.isOwnProject = function (project) {
            return AUTH_OWN_PROJECTS.indexOf(project.id) !== -1;
        };

        $scope.isEditing = function () {
            return editing;
        };

        $scope.getVisibilityId = function () {
            return LABEL_TREE.visibility_id;
        };

        $scope.toggleEditing = function () {
            if (!ownProjects) {
                ownProjects = Project.query(updateProjectsForAuthorization);
            }

            editing = !editing;
        };

        $scope.isLoading = function () {
            return loading;
        };

        $scope.getProjectsForAuthorization = function () {
            return projectsForAuthorization;
        };

        $scope.addAuthorizedProject = function (project) {
            loading = true;
            LabelTreeAuthorizedProject.addAuthorized(
                {id: LABEL_TREE.id},
                {id: project.id},
                function () {
                    projectAdded(project);
                },
                handleError
            );
        };

        $scope.removeAuthorizedProject = function (project) {
            loading = true;
            LabelTreeAuthorizedProject.removeAuthorized(
                {id: LABEL_TREE.id},
                {id: project.id},
                function () {
                    projectRemoved(project);
                },
                handleError
            );
        };
    }]
);

/**
 * @namespace biigle.label-trees
 * @ngdoc controller
 * @name LabelTreeController
 * @memberOf biigle.label-trees
 * @description Controller for the label tree information
 */
angular.module('biigle.label-trees').controller('LabelTreeController', ["$scope", "LABEL_TREE", "LabelTree", "msg", "$timeout", "LabelTreeUser", "USER_ID", "REDIRECT_URL", function ($scope,  LABEL_TREE, LabelTree, msg, $timeout, LabelTreeUser, USER_ID, REDIRECT_URL) {
        "use strict";

        var editing = false;
        var saving = false;

        $scope.labelTreeInfo = {
            name: LABEL_TREE.name,
            description: LABEL_TREE.description,
            visibility_id: LABEL_TREE.visibility_id.toString()
        };

        var handleSavingError = function (response) {
            msg.responseError(response);
            saving = false;
        };

        var infoUpdated = function (tree) {
            LABEL_TREE.name = tree.name;
            LABEL_TREE.description = tree.description;
            LABEL_TREE.visibility_id = parseInt(tree.visibility_id);
            editing = false;
            saving = false;
        };

        var treeDeleted = function () {
            msg.success('The label tree was deleted. Redirecting...');
            $timeout(function () {
                window.location.href = REDIRECT_URL;
             }, 2000);
        };

        var userLeft = function (redirect) {
            if (redirect) {
                msg.success('You left the label tree. Redirecting...');
                $timeout(function () {
                    window.location.href = REDIRECT_URL;
                 }, 2000);
            } else {
                msg.success('You left the label tree. Reloading...');
                $timeout(function () {
                    window.location.reload();
                 }, 2000);
            }
        };

        $scope.isEditing = function () {
            return editing;
        };

        $scope.toggleEditing = function () {
            editing = !editing;
        };

        $scope.isSaving = function () {
            return saving;
        };

        $scope.getVisibilityId = function () {
            return LABEL_TREE.visibility_id;
        };

        $scope.getName = function () {
            return LABEL_TREE.name;
        };

        $scope.getDescription = function () {
            return LABEL_TREE.description;
        };

        $scope.saveChanges = function () {
            saving = true;
            LabelTree.update({
                id: LABEL_TREE.id,
                name: $scope.labelTreeInfo.name,
                description: $scope.labelTreeInfo.description,
                visibility_id: parseInt($scope.labelTreeInfo.visibility_id)
            }, infoUpdated, handleSavingError);
        };

        $scope.discardChanges = function () {
            $scope.labelTreeInfo.name = LABEL_TREE.name;
            $scope.labelTreeInfo.description = LABEL_TREE.description;
            $scope.labelTreeInfo.visibility_id = LABEL_TREE.visibility_id.toString();
            editing = false;
        };

        $scope.deleteTree = function () {
            if (confirm('Do you really want to delete the label tree ' + LABEL_TREE.name + '?')) {
                LabelTree.delete({id: LABEL_TREE.id}, treeDeleted, msg.responseError);
            }
        };

        $scope.leaveTree = function (redirect) {
            // redirect if the tree is private, otherwise reload
            if (confirm('Do you really want to leave the label tree ' + LABEL_TREE.name + '?')) {
                LabelTreeUser.detach(
                    {label_tree_id: LABEL_TREE.id},
                    {id: USER_ID},
                    function () {
                        userLeft(redirect);
                    },
                    msg.responseError
                );
            }
        };
    }]
);

/**
 * @namespace biigle.label-trees
 * @ngdoc controller
 * @name MembersController
 * @memberOf biigle.label-trees
 * @description Controller for the the members of a label tree
 */
angular.module('biigle.label-trees').controller('MembersController', ["$scope", "LABEL_TREE", "MEMBERS", "ROLES", "DEFAULT_ROLE_ID", "USER_ID", "LabelTreeUser", "msg", "User", function ($scope, LABEL_TREE, MEMBERS, ROLES, DEFAULT_ROLE_ID, USER_ID, LabelTreeUser, msg, User) {
        "use strict";

        var editing = false;
        var loading = false;

        $scope.newMember = {
            user: null,
            role_id: DEFAULT_ROLE_ID.toString()
        };

        var handleError = function (response) {
            msg.responseError(response);
            loading = false;
        };

        var roleUpdated = function (member) {
            member.role_id = parseInt(member.tmp_role_id);
            loading = false;
        };

        var roleUpdateFailed = function (member, response) {
            member.tmp_role_id = member.role_id.toString();
            handleError(response);
        };

        var memberRemoved = function (member) {
            for (var i = MEMBERS.length - 1; i >= 0; i--) {
                if (MEMBERS[i].id === member.id) {
                    MEMBERS.splice(i, 1);
                    break;
                }
            }
            loading = false;
        };

        var userIsNoMember = function (user) {
            for (var i = MEMBERS.length - 1; i >= 0; i--) {
                if (MEMBERS[i].id === user.id) {
                    return false;
                }
            }

            return true;
        };

        var filterMembersFromUsers = function (users) {
            return users.filter(userIsNoMember);
        };

        var memberAttached = function (member) {
            member.tmp_role_id = member.role_id.toString();
            MEMBERS.push(member);
            $scope.newMember.user = null;
            loading = false;
        };

        $scope.isEditing = function () {
            return editing;
        };

        $scope.toggleEditing = function () {
            editing = !editing;
        };

        $scope.isLoading = function () {
            return loading;
        };

        $scope.getMembers = function () {
            return MEMBERS;
        };

        $scope.hasMembers = function () {
            return MEMBERS.length > 0;
        };

        $scope.getRoles = function () {
            return ROLES;
        };

        $scope.getRole = function (id) {
            return ROLES[id];
        };

        $scope.isOwnUser = function (member) {
            return USER_ID === member.id;
        };

        $scope.updateRole = function (member) {
            loading = true;
            LabelTreeUser.update(
                {label_tree_id: LABEL_TREE.id},
                {id: member.id, role_id: parseInt(member.tmp_role_id)},
                function () {
                    roleUpdated(member);
                },
                function (response) {
                    roleUpdateFailed(member, response);
                }
            );
        };

        $scope.detachMember = function (member) {
            loading = true;
            LabelTreeUser.detach(
                {label_tree_id: LABEL_TREE.id},
                {id: member.id},
                function () {
                    memberRemoved(member);
                },
                handleError
            );
        };

        $scope.username = function (user) {
            if (user && user.firstname && user.lastname) {
                return user.firstname + ' ' + user.lastname;
            }

            return '';
        };

        $scope.findUser = function (query) {
            return User.find({query: encodeURIComponent(query)}).$promise
                .then(filterMembersFromUsers);
        };

        $scope.newMemberValid = function () {
            return $scope.newMember.user &&
                $scope.newMember.user.id !== undefined &&
                userIsNoMember($scope.newMember.user) &&
                $scope.newMember.role_id !== null;
        };

        $scope.attachMember = function () {
            if (!$scope.newMemberValid()) return;

            loading = true;
            var member = $scope.newMember.user;
            // overwrite global role_id returned from User.find() with label tree role_id
            member.role_id = parseInt($scope.newMember.role_id);

            LabelTreeUser.attach(
                {label_tree_id: LABEL_TREE.id},
                {id: member.id, role_id: member.role_id},
                function () {
                    memberAttached(member);
                },
                handleError
            );
        };

        // convert role IDs to string so they can be selected in a select input field
        // also add it as tmp_role_id so the ID can be reset if the change failed
        for (var i = MEMBERS.length - 1; i >= 0; i--) {
            MEMBERS[i].tmp_role_id = MEMBERS[i].role_id.toString();
        }
    }]
);

/**
 * @namespace biigle.label-trees
 * @ngdoc directive
 * @name labelTreeItem
 * @memberOf biigle.label-trees
 * @description A label tree item.
 */
angular.module('biigle.label-trees').directive('labelTreeItem', ["$compile", "$timeout", "$templateCache", function ($compile, $timeout, $templateCache) {
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
                var open = false;
                // this item has children
                var expandable = false;
                // this item is currently selected
                var selected = false;

                var checkState = function () {
                    if ($scope.openHierarchy.indexOf($scope.item.id) !== -1) {
                        open = true;
                        selected = false;
                    } else if ($scope.isSelectedLabel($scope.item)) {
                        open = true;
                        selected = true;
                    } else {
                        open = false;
                        selected = false;
                    }
                };

                var checkExpandable = function () {
                    expandable = $scope.tree && $scope.tree.hasOwnProperty($scope.item.id);
                };

                $scope.getSubtree = function () {
                    if (open) {
                        return $scope.tree[$scope.item.id];
                    }

                    return [];
                };


                $scope.getClass = function () {
                    return {
                        open: open,
                        expandable: expandable,
                        selected: selected
                    };
                };

                $scope.$on('labels.selected', checkState);
                $scope.$on('labels.refresh', checkExpandable);
                checkState();
                checkExpandable();
            }]
        };
    }]
);

/**
 * @namespace biigle.ate
 * @ngdoc service
 * @name rancomColor
 * @memberOf biigle.label-trees
 * @description Provides a machanism for random colors
 */
angular.module('biigle.label-trees').service('randomColor', function () {
        "use strict";

        // HSV values
        var MIN = [0, 0.5, 0.9];
        var MAX = [360, 1, 1];

        // number of decimals to keep
        var PRECISION = [0, 2, 2];

        // see https://de.wikipedia.org/wiki/HSV-Farbraum#Transformation_von_RGB_und_HSV.2FHSL
        var toRgb = function (hsv) {

            var tmp = hsv[0] / 60;
            var hi = Math.floor(tmp);
            var f = tmp - hi;
            var pqt = [
                hsv[2] * (1 - hsv[1]),
                hsv[2] * (1 - hsv[1] * f),
                hsv[2] * (1 - hsv[1] * (1 - f))
            ];

            var rgb;

            switch (hi) {
                case 1:
                    rgb = [pqt[1], hsv[2], pqt[0]];
                    break;
                case 2:
                    rgb = [pqt[0], hsv[2], pqt[2]];
                    break;
                case 3:
                    rgb = [pqt[0], pqt[1], hsv[2]];
                    break;
                case 4:
                    rgb = [pqt[2], pqt[0], hsv[2]];
                    break;
                case 5:
                    rgb = [hsv[2], pqt[0], pqt[1]];
                    break;
                default:
                    rgb = [hsv[2], pqt[2], pqt[0]];
            }

            return rgb.map(function(item) {
                return Math.round(item * 255);
            });
        };

        var toHex = function (rgb) {
            return rgb.map(function (item) {
                item = item.toString(16);
                return (item.length === 1) ? ('0' + item) : item;
            });
        };

        this.get = function () {
            var color = [0, 0, 0];
            var precision;
            for (var i = color.length - 1; i >= 0; i--) {
                precision = 10 * PRECISION[i];
                color[i] = (MAX[i] - MIN[i]) * Math.random() + MIN[i];
                if (precision !== 0) {
                    color[i] = Math.round(color[i] * precision) / precision;
                } else {
                    color[i] = Math.round(color[i]);
                }
            }

            return '#' + toHex(toRgb(color)).join('');
        };
    }
);

/**
 * Resource for finding labels from an external source.
 *
 * var resource = biigle.$require('api.labelSource');
 *
 * Find labels:
 *
 * resource.query({id: 1, query: 'Kolga'}).then(...);
 *
 * @type {Vue.resource}
 */
biigle.$declare('api.labelSource', Vue.resource('/api/v1/label-sources{/id}/find'));

/**
 * Resource for labels.
 *
 * var resource = biigle.$require('api.labels');
 *
 * Create a label:
 *
 * resource.save({label_tree_id: 1}, {
 *     name: "Trash",
 *     color: 'bada55'
 * }).then(...);
 *
 * Delete a label:
 *
 * resource.delete({id: labelId}).then(...);
 *
 * @type {Vue.resource}
 */
biigle.$declare('api.labels', Vue.resource('/api/v1/labels{/id}', {}, {
    save: {
        method: 'POST',
        url: '/api/v1/label-trees{/label_tree_id}/labels',
    }
}));

/**
 * A component that displays a label tree. The labels can be searched and selected.
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.labelTree', {
    template: '<div class="label-tree">' +
        '<h4 class="label-tree__title" v-if="showTitle">' +
            '<button v-if="collapsible" @click.stop="collapse" class="btn btn-default btn-xs pull-right" :title="collapseTitle">' +
                '<span v-if="collapsed" class="glyphicon glyphicon-chevron-down" aria-hidden="true"></span>' +
                '<span v-else class="glyphicon glyphicon-chevron-up" aria-hidden="true"></span>' +
            '</button>' +
            '{{name}}' +
        '</h4>' +
        '<ul v-if="!collapsed" class="label-tree__list">' +
            '<label-tree-label :label="label" :deletable="deletable" v-for="label in rootLabels" @select="emitSelect" @deselect="emitDeselect" @delete="emitDelete"></label-tree-label>' +
        '</ul>' +
    '</div>',
    data: function () {
        return {
            collapsed: false
        };
    },
    components: {
        labelTreeLabel: biigle.$require('labelTrees.components.labelTreeLabel'),
    },
    props: {
        name: {
            type: String,
            required: true,
        },
        labels: {
            type: Array,
            required: true,
        },
        showTitle: {
            type: Boolean,
            default: true,
        },
        standalone: {
            type: Boolean,
            default: false,
        },
        collapsible: {
            type: Boolean,
            default: true,
        },
        multiselect: {
            type: Boolean,
            default: false,
        },
        deletable: {
            type: Boolean,
            default: false,
        }
    },
    computed: {
        labelMap: function () {
            var map = {};
            for (var i = this.labels.length - 1; i >= 0; i--) {
                map[this.labels[i].id] = this.labels[i];
            }

            return map;
        },
        compiledLabels: function () {
            var compiled = {};
            var parent;
            // Create datastructure that maps label IDs to the child labels.
            // Go from 0 to length so the labels are kept in order.
            for (var i = 0, length = this.labels.length; i < length; i++) {
                parent = this.labels[i].parent_id;
                if (compiled.hasOwnProperty(parent)) {
                    compiled[parent].push(this.labels[i]);
                } else {
                    compiled[parent] = [this.labels[i]];
                }
            }

            // update the label children with the compiled datastructure
            for (i = this.labels.length - 1; i >= 0; i--) {
                if (compiled.hasOwnProperty(this.labels[i].id)) {
                    Vue.set(this.labels[i], 'children', compiled[this.labels[i].id]);
                } else {
                    Vue.set(this.labels[i], 'children', undefined);
                    // If the last child was deleted, close the label.
                    this.labels[i].open = false;
                }
            }

            return compiled;
        },
        rootLabels: function () {
            return this.compiledLabels[null];
        },
        collapseTitle: function () {
            return this.collapsed ? 'Expand' : 'Collapse';
        }
    },
    methods: {
        hasLabel: function (id) {
            return this.labelMap.hasOwnProperty(id);
        },
        getLabel: function (id) {
            return this.labelMap[id];
        },
        getParents: function (label) {
            var parents = [];
            while (label.parent_id !== null) {
                label = this.getLabel(label.parent_id);
                parents.unshift(label.id);
            }

            return parents;
        },
        emitSelect: function (label) {
            this.$emit('select', label);
        },
        emitDeselect: function (label) {
            this.$emit('deselect', label);
        },
        emitDelete: function (label) {
            this.$emit('delete', label);
        },
        selectLabel: function (label) {
            if (!this.multiselect) {
                this.clearSelectedLabels();
            }

            // The selected label does not nessecarily belong to this label tree since
            // the tree may be displayed in a label-trees component with other trees.
            if (this.hasLabel(label.id)) {
                label.selected = true;
                this.collapsed = false;
                var parents = this.getParents(label);
                for (var i = parents.length - 1; i >= 0; i--) {
                    this.getLabel(parents[i]).open = true;
                }
            }
        },
        deselectLabel: function (label) {
            if (this.hasLabel(label.id)) {
                label.selected = false;
            }
        },
        clearSelectedLabels: function () {
            for (var i = this.labels.length - 1; i >= 0; i--) {
                this.labels[i].selected = false;
            }
        },
        collapse: function () {
            this.collapsed = !this.collapsed;
        }
    },
    created: function () {
        // Set the label properties
        for (i = this.labels.length - 1; i >= 0; i--) {
            Vue.set(this.labels[i], 'open', false);
            Vue.set(this.labels[i], 'selected', false);
        }

        // The label tree can be used in a label-trees component or as a single label
        // tree. In a label-trees component only one label can be selected in all label
        // trees so the parent handles the event. A single label tree handles the event
        // by itself.
        if (this.standalone) {
            this.$on('select', this.selectLabel);
            this.$on('deselect', this.deselectLabel);
        } else {
            this.$parent.$on('select', this.selectLabel);
            this.$parent.$on('deselect', this.deselectLabel);
            this.$parent.$on('clear', this.clearSelectedLabels);
        }
    }
});

/**
 * A component that displays a single label of a label tree.
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.labelTreeLabel', {
    name: 'label-tree-label',
    template: '<li class="label-tree-label cf" :class="classObject">' +
        '<div class="label-tree-label__name" @click="toggleOpen">' +
            '<span class="label-tree-label__color" :style="colorStyle"></span>' +
            '<span v-text="label.name" @click.stop="toggleSelect"></span>' +
            '<span v-if="showFavourite" class="label-tree-label__favourite" @click.stop="toggleFavourite">' +
                '<span class="glyphicon" :class="favouriteClass" aria-hidden="true" title=""></span>' +
            '</span>' +
            '<button v-if="deletable" type="button" class="close label-tree-label__delete" :title="deleteTitle" @click.stop="deleteThis"><span aria-hidden="true">&times;</span></button>' +
        '</div>' +
        '<ul v-if="label.open" class="label-tree__list">' +
            '<label-tree-label :label="child" :deletable="deletable" v-for="child in label.children" @select="emitSelect" @deselect="emitDeselect" @delete="emitDelete"></label-tree-label>' +
        '</ul>' +
    '</li>',
    data: function () {
        return {
            favourite: false
        };
    },
    props: {
        label: {
            type: Object,
            required: true,
        },
        showFavourite: {
            type: Boolean,
            required: false,
        },
        deletable: {
            type: Boolean,
            default: false,
        }
    },
    computed: {
        classObject: function () {
            return {
                'label-tree-label--selected': this.label.selected,
                'label-tree-label--expandable': this.label.children,
            };
        },
        colorStyle: function () {
            return {
                'background-color': '#' + this.label.color
            };
        },
        favouriteClass: function () {
            return {
                'glyphicon-star-empty': !this.favourite,
                'glyphicon-star': this.favourite,
            };
        },
        deleteTitle: function () {
            return 'Remove label ' + this.label.name;
        }
    },
    methods: {
        toggleSelect: function () {
            if (!this.label.selected) {
                this.$emit('select', this.label);
            } else {
                this.$emit('deselect', this.label);
            }
        },
        // a method called 'delete' didn't work
        deleteThis: function () {
            this.emitDelete(this.label);
        },
        toggleOpen: function () {
            // If the label cannot be opened, it will be selected here instead.
            if (!this.label.children) {
                this.toggleSelect();
            } else {
                this.label.open = !this.label.open;
            }
        },
        toggleFavourite: function () {
            this.favourite = !this.favourite;
        },
        emitSelect: function (label) {
            // bubble the event upwards
            this.$emit('select', label);
        },
        emitDeselect: function (label) {
            // bubble the event upwards
            this.$emit('deselect', label);
        },
        emitDelete: function (label) {
            // bubble the event upwards
            this.$emit('delete', label);
        }
    }
});

/**
 * A component that displays a typeahead to find labels.
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.labelTypeahead', {
    template: '<typeahead class="label-typeahead clearfix" :data="labels" :placeholder="placeholder" :on-hit="selectLabel" :template="template" :disabled="disabled" :value="value" match-property="name"></typeahead>',
    data: function () {
        return {
            template: '{{item.name}}',
        };
    },
    components: {
        typeahead: VueStrap.typeahead,
    },
    props: {
        labels: {
            type: Array,
            required: true,
        },
        placeholder: {
            type: String,
            default: 'Label name',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        value: {
            type: String,
            default: '',
        },
    },
    methods: {
        selectLabel: function (label, typeahead) {
            this.$emit('select', label);
            typeahead.reset();
        }
    }
});

/**
 * A component for a form to manually create a new label for a label tree
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.manualLabelForm', {
    mixins: [biigle.$require('labelTrees.mixins.labelFormComponent')],
    methods: {
        submit: function () {
            var label = {
                name: this.selectedName,
                color: this.selectedColor,
            };

            if (this.parent) {
                label.parent_id = this.parent.id;
            }

            this.$emit('submit', label);
        }
    },
});

/**
 * A component for a form to manually create a new label for a label tree
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.wormsLabelForm', {
    mixins: [biigle.$require('labelTrees.mixins.labelFormComponent')],
    components: {
        wormsResultItem: biigle.$require('labelTrees.components.wormsResultItem'),
    },
    data: function () {
        return {
            results: [],
            recursive: false,
            hasSearched: false,
        };
    },
    computed: {
        hasResults: function () {
            return this.results.length > 0;
        },
        recursiveButtonClass: function () {
            return {
                active: this.recursive,
                'btn-primary': this.recursive,
            };
        }
    },
    methods: {
        submit: function () {
            // this.$emit('submit');
        },
        findName: function () {
            var worms = biigle.$require('labelTrees.wormsLabelSource');
            var labelSource = biigle.$require('api.labelSource');
            var messages = biigle.$require('messages.store');
            var self = this;
            this.$emit('load-start');

            labelSource.query({id: worms.id, query: this.selectedName})
                .then(this.updateResults, messages.handleErrorResponse)
                .finally(function () {
                    self.hasSearched = true;
                    self.$emit('load-finish');
                });
        },
        updateResults: function (response) {
            this.results = response.data;
        },
        importItem: function (item) {
            var worms = biigle.$require('labelTrees.wormsLabelSource');

            var label = {
                name: item.name,
                color: this.selectedColor,
                source_id: item.aphia_id,
                label_source_id: worms.id,
            };

            if (this.recursive) {
                label.recursive = 'true';
            } else if (this.parent) {
                label.parent_id = this.parent.id;
            }

            this.$emit('submit', label);
        },
        toggleRecursive: function () {
            this.recursive = !this.recursive;
        }
    },
});

/**
 * An item of the results list of a WoRMS search
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.wormsResultItem', {
    props: {
        item: {
            type: Object,
            required: true,
        },
        recursive: {
            type: Boolean,
            required: true,
        },
        labels: {
            type: Array,
            required: true,
        },
        parent: {
            type: Object,
            default: null,
        }
    },
    computed: {
        classification: function () {
            return this.item.parents.join(' > ');
        },
        buttonTitle: function () {
            if (this.recursive) {
                return 'Add ' + this.item.name + ' and all WoRMS parents as new labels';
            }

            if (this.parent) {
                return 'Add ' + this.item.name + ' as a child of ' + this.parent.name;
            }

            return 'Add ' + this.item.name + ' as a root label';
        },
        classObject: function () {
            return {
                'list-group-item-success': this.selected
            };
        },
        selected: function () {
            var self = this;
            return !!this.labels.find(function (label) {
                return label.source_id == self.item.aphia_id;
            });
        }
    },
    methods: {
        select: function () {
            if (!this.selected) {
                this.$emit('select', this.item);
            }
        },
    },
});

/**
 * A mixin for components that create new labels
 *
 * @type {Object}
 */
biigle.$component('labelTrees.mixins.labelFormComponent', {
    props: {
        labels: {
            type: Array,
            required: true,
        },
        color: {
            type: String,
            default: '',
        },
        parent: {
            type: Object,
            default: null,
        },
        name: {
            type: String,
            default: '',
        },
    },
    components: {
        labelTypeahead: biigle.$require('labelTrees.components.labelTypeahead'),
    },
    computed: {
        selectedColor: {
            get: function () {
                return this.color;
            },
            set: function (color) {
                this.$emit('color', color);
            }
        },
        selectedName: {
            get: function () {
                return this.name;
            },
            set: function (name) {
                this.$emit('name', name);
            }
        },
        selectedParent: function () {
            return this.parent ? this.parent.name : '';
        },
        hasNoLabels: function () {
            return this.labels.length === 0;
        },
        hasNoParent: function () {
            return !this.parent;
        },
        hasNoName: function () {
            return !this.name;
        }
    },
    methods: {
        refreshColor: function () {
            this.selectedColor = biigle.$require('labelTrees.randomColor')();
        },
        resetParent: function () {
            this.$emit('parent', null);
        },
        selectLabel: function (label) {
            this.$emit('parent', label);
        },
    },
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxhYmVsLXRyZWVzL21haW4uanMiLCJ2dWUvbGFiZWxUcmVlc0xhYmVscy5qcyIsInZ1ZS9yYW5kb21Db2xvci5qcyIsImxhYmVsLXRyZWVzL2NvbnRyb2xsZXJzL0F1dGhvcml6ZWRQcm9qZWN0c0NvbnRyb2xsZXIuanMiLCJsYWJlbC10cmVlcy9jb250cm9sbGVycy9MYWJlbFRyZWVDb250cm9sbGVyLmpzIiwibGFiZWwtdHJlZXMvY29udHJvbGxlcnMvTWVtYmVyc0NvbnRyb2xsZXIuanMiLCJsYWJlbC10cmVlcy9kaXJlY3RpdmVzL2xhYmVsVHJlZUl0ZW0uanMiLCJsYWJlbC10cmVlcy9zZXJ2aWNlcy9yYW5kb21Db2xvci5qcyIsInZ1ZS9hcGkvbGFiZWxTb3VyY2UuanMiLCJ2dWUvYXBpL2xhYmVscy5qcyIsInZ1ZS9jb21wb25lbnRzL2xhYmVsVHJlZS5qcyIsInZ1ZS9jb21wb25lbnRzL2xhYmVsVHJlZUxhYmVsLmpzIiwidnVlL2NvbXBvbmVudHMvbGFiZWxUeXBlYWhlYWQuanMiLCJ2dWUvY29tcG9uZW50cy9tYW51YWxMYWJlbEZvcm0uanMiLCJ2dWUvY29tcG9uZW50cy93b3Jtc0xhYmVsRm9ybS5qcyIsInZ1ZS9jb21wb25lbnRzL3dvcm1zUmVzdWx0SXRlbS5qcyIsInZ1ZS9taXhpbnMvbGFiZWxGb3JtQ29tcG9uZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUEsUUFBQSxPQUFBLHNCQUFBLENBQUEsY0FBQTs7Ozs7O0FBTUEsUUFBQSxPQUFBLHNCQUFBLDRCQUFBLFVBQUEsa0JBQUE7SUFDQTs7SUFFQSxpQkFBQSxpQkFBQTs7Ozs7O0FDVkEsT0FBQSxXQUFBLHNCQUFBLFVBQUEsU0FBQTtJQUNBLElBQUEsU0FBQSxPQUFBLFNBQUE7SUFDQSxJQUFBLFdBQUEsT0FBQSxTQUFBO0lBQ0EsSUFBQSxjQUFBLE9BQUEsU0FBQTtJQUNBLElBQUEsWUFBQSxPQUFBLFNBQUE7O0lBRUEsSUFBQSxJQUFBO1FBQ0Es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QUEsSUFBQTs7O1FBR0EsSUFBQTs7UUFFQSxRQUFBO1lBQ0EsS0FBQTtnQkFDQSxNQUFBLENBQUEsSUFBQSxJQUFBLElBQUEsSUFBQSxJQUFBO2dCQUNBO1lBQ0EsS0FBQTtnQkFDQSxNQUFBLENBQUEsSUFBQSxJQUFBLElBQUEsSUFBQSxJQUFBO2dCQUNBO1lBQ0EsS0FBQTtnQkFDQSxNQUFBLENBQUEsSUFBQSxJQUFBLElBQUEsSUFBQSxJQUFBO2dCQUNBO1lBQ0EsS0FBQTtnQkFDQSxNQUFBLENBQUEsSUFBQSxJQUFBLElBQUEsSUFBQSxJQUFBO2dCQUNBO1lBQ0EsS0FBQTtnQkFDQSxNQUFBLENBQUEsSUFBQSxJQUFBLElBQUEsSUFBQSxJQUFBO2dCQUNBO1lBQ0E7Z0JBQ0EsTUFBQSxDQUFBLElBQUEsSUFBQSxJQUFBLElBQUEsSUFBQTs7O1FBR0EsT0FBQSxJQUFBLElBQUEsU0FBQSxNQUFBO1lBQ0EsT0FBQSxLQUFBLE1BQUEsT0FBQTs7OztJQUlBLElBQUEsUUFBQSxVQUFBLEtBQUE7UUFDQSxPQUFBLElBQUEsSUFBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLEtBQUEsU0FBQTtZQUNBLE9BQUEsQ0FBQSxLQUFBLFdBQUEsTUFBQSxNQUFBLFFBQUE7Ozs7SUFJQSxPQUFBLFlBQUE7UUFDQSxJQUFBLFFBQUEsQ0FBQSxHQUFBLEdBQUE7UUFDQSxJQUFBO1FBQ0EsS0FBQSxJQUFBLElBQUEsTUFBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7WUFDQSxZQUFBLEtBQUEsVUFBQTtZQUNBLE1BQUEsS0FBQSxDQUFBLElBQUEsS0FBQSxJQUFBLE1BQUEsS0FBQSxXQUFBLElBQUE7WUFDQSxJQUFBLGNBQUEsR0FBQTtnQkFDQSxNQUFBLEtBQUEsS0FBQSxNQUFBLE1BQUEsS0FBQSxhQUFBO21CQUNBO2dCQUNBLE1BQUEsS0FBQSxLQUFBLE1BQUEsTUFBQTs7OztRQUlBLE9BQUEsTUFBQSxNQUFBLE1BQUEsUUFBQSxLQUFBOzs7Ozs7Ozs7OztBQzlEQSxRQUFBLE9BQUEsc0JBQUEsV0FBQSx3SUFBQSxV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QSxVQUFBO1FBQ0EsSUFBQSxVQUFBOztRQUVBLE9BQUEsWUFBQTtZQUNBLE1BQUE7WUFDQSxTQUFBLGdCQUFBOzs7UUFHQSxJQUFBLGNBQUEsVUFBQSxVQUFBO1lBQ0EsSUFBQSxjQUFBO1lBQ0EsVUFBQTs7O1FBR0EsSUFBQSxjQUFBLFVBQUEsUUFBQTtZQUNBLE9BQUEsVUFBQSxTQUFBLE9BQUE7WUFDQSxVQUFBOzs7UUFHQSxJQUFBLG1CQUFBLFVBQUEsUUFBQSxVQUFBO1lBQ0EsT0FBQSxjQUFBLE9BQUEsUUFBQTtZQUNBLFlBQUE7OztRQUdBLElBQUEsZ0JBQUEsVUFBQSxRQUFBO1lBQ0EsS0FBQSxJQUFBLElBQUEsUUFBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7Z0JBQ0EsSUFBQSxRQUFBLEdBQUEsT0FBQSxPQUFBLElBQUE7b0JBQ0EsUUFBQSxPQUFBLEdBQUE7b0JBQ0E7OztZQUdBLFVBQUE7OztRQUdBLElBQUEsaUJBQUEsVUFBQSxNQUFBO1lBQ0EsS0FBQSxJQUFBLElBQUEsUUFBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7Z0JBQ0EsSUFBQSxRQUFBLEdBQUEsT0FBQSxLQUFBLElBQUE7b0JBQ0EsT0FBQTs7OztZQUlBLE9BQUE7OztRQUdBLElBQUEseUJBQUEsVUFBQSxPQUFBO1lBQ0EsT0FBQSxNQUFBLE9BQUE7OztRQUdBLElBQUEsaUJBQUEsVUFBQSxRQUFBO1lBQ0EsT0FBQSxjQUFBLE9BQUEsUUFBQTtZQUNBLFFBQUEsS0FBQTtZQUNBLE9BQUEsVUFBQSxPQUFBO1lBQ0EsVUFBQTs7O1FBR0EsT0FBQSxZQUFBLFlBQUE7WUFDQSxPQUFBOzs7UUFHQSxPQUFBLGdCQUFBLFlBQUE7WUFDQSxVQUFBLENBQUE7OztRQUdBLE9BQUEsWUFBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsT0FBQSxhQUFBLFlBQUE7WUFDQSxPQUFBOzs7UUFHQSxPQUFBLGFBQUEsWUFBQTtZQUNBLE9BQUEsUUFBQSxTQUFBOzs7UUFHQSxPQUFBLFdBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLE9B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QSxLQUFBO1FBQ0EsSUFBQSxNQUFBLENBQUEsS0FBQSxHQUFBOzs7UUFHQSxJQUFBLFlBQUEsQ0FBQSxHQUFBLEdBQUE7OztRQUdBLElBQUEsUUFBQSxVQUFBLEtBQUE7O1lBRUEsSUFBQSxNQUFBLElBQUEsS0FBQTtZQUNBLElBQUEsS0FBQSxLQUFBLE1BQUE7WUFDQSxJQUFBLElBQUEsTUFBQTtZQUNBLElBQUEsTUFBQTtnQkFDQSxJQUFBLE1BQUEsSUFBQSxJQUFBO2dCQUNBLElBQUEsTUFBQSxJQUFBLElBQUEsS0FBQTtnQkFDQSxJQUFBLE1BQUEsSUFBQSxJQUFBLE1BQUEsSUFBQTs7O1lBR0EsSUFBQTs7WUFFQSxRQUFBO2dCQUNBLEtBQUE7b0JBQ0EsTUFBQSxDQUFBLElBQUEsSUFBQSxJQUFBLElBQUEsSUFBQTtvQkFDQTtnQkFDQSxLQUFBO29CQUNBLE1BQUEsQ0FBQSxJQUFBLElBQUEsSUFBQSxJQUFBLElBQUE7b0JBQ0E7Z0JBQ0EsS0FBQTtvQkFDQSxNQUFBLENBQUEsSUFBQSxJQUFBLElBQUEsSUFBQSxJQUFBO29CQUNBO2dCQUNBLEtBQUE7b0JBQ0EsTUFBQSxDQUFBLElBQUEsSUFBQSxJQUFBLElBQUEsSUFBQTtvQkFDQTtnQkFDQSxLQUFBO29CQUNBLE1BQUEsQ0FBQSxJQUFBLElBQUEsSUFBQSxJQUFBLElBQUE7b0JBQ0E7Z0JBQ0E7b0JBQ0EsTUFBQSxDQUFBLElBQUEsSUFBQSxJQUFBLElBQUEsSUFBQTs7O1lBR0EsT0FBQSxJQUFBLElBQUEsU0FBQSxNQUFBO2dCQUNBLE9BQUEsS0FBQSxNQUFBLE9BQUE7Ozs7UUFJQSxJQUFBLFFBQUEsVUFBQSxLQUFBO1lBQ0EsT0FBQSxJQUFBLElBQUEsVUFBQSxNQUFBO2dCQUNBLE9BQUEsS0FBQSxTQUFBO2dCQUNBLE9BQUEsQ0FBQSxLQUFBLFdBQUEsTUFBQSxNQUFBLFFBQUE7Ozs7UUFJQSxLQUFBLE1BQUEsWUFBQTtZQUNBLElBQUEsUUFBQSxDQUFBLEdBQUEsR0FBQTtZQUNBLElBQUE7WUFDQSxLQUFBLElBQUEsSUFBQSxNQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtnQkFDQSxZQUFBLEtBQUEsVUFBQTtnQkFDQSxNQUFBLEtBQUEsQ0FBQSxJQUFBLEtBQUEsSUFBQSxNQUFBLEtBQUEsV0FBQSxJQUFBO2dCQUNBLElBQUEsY0FBQSxHQUFBO29CQUNBLE1BQUEsS0FBQSxLQUFBLE1BQUEsTUFBQSxLQUFBLGFBQUE7dUJBQ0E7b0JBQ0EsTUFBQSxLQUFBLEtBQUEsTUFBQSxNQUFBOzs7O1lBSUEsT0FBQSxNQUFBLE1BQUEsTUFBQSxRQUFBLEtBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7QUNqRUEsT0FBQSxTQUFBLG1CQUFBLElBQUEsU0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNPQSxPQUFBLFNBQUEsY0FBQSxJQUFBLFNBQUEsdUJBQUEsSUFBQTtJQUNBLE1BQUE7UUFDQSxRQUFBO1FBQ0EsS0FBQTs7Ozs7Ozs7O0FDaEJBLE9BQUEsV0FBQSxtQ0FBQTtJQUNBLFVBQUE7UUFDQTtZQUNBO2dCQUNBO2dCQUNBO1lBQ0E7WUFDQTtRQUNBO1FBQ0E7WUFDQTtRQUNBO0lBQ0E7SUFDQSxNQUFBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsV0FBQTs7O0lBR0EsWUFBQTtRQUNBLGdCQUFBLE9BQUEsU0FBQTs7SUFFQSxPQUFBO1FBQ0EsTUFBQTtZQUNBLE1BQUE7WUFDQSxVQUFBOztRQUVBLFFBQUE7WUFDQSxNQUFBO1lBQ0EsVUFBQTs7UUFFQSxXQUFBO1lBQ0EsTUFBQTtZQUNBLFNBQUE7O1FBRUEsWUFBQTtZQUNBLE1BQUE7WUFDQSxTQUFBOztRQUVBLGFBQUE7WUFDQSxNQUFBO1lBQ0EsU0FBQTs7UUFFQSxhQUFBO1lBQ0EsTUFBQTtZQUNBLFNBQUE7O1FBRUEsV0FBQTtZQUNBLE1BQUE7WUFDQSxTQUFBOzs7SUFHQSxVQUFBO1FBQ0EsVUFBQSxZQUFBO1lBQ0EsSUFBQSxNQUFBO1lBQ0EsS0FBQSxJQUFBLElBQUEsS0FBQSxPQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtnQkFDQSxJQUFBLEtBQUEsT0FBQSxHQUFBLE1BQUEsS0FBQSxPQUFBOzs7WUFHQSxPQUFBOztRQUVBLGdCQUFBLFlBQUE7WUFDQSxJQUFBLFdBQUE7WUFDQSxJQUFBOzs7WUFHQSxLQUFBLElBQUEsSUFBQSxHQUFBLFNBQUEsS0FBQSxPQUFBLFFBQUEsSUFBQSxRQUFBLEtBQUE7Z0JBQ0EsU0FBQSxLQUFBLE9BQUEsR0FBQTtnQkFDQSxJQUFBLFNBQUEsZUFBQSxTQUFBO29CQUNBLFNBQUEsUUFBQSxLQUFBLEtBQUEsT0FBQTt1QkFDQTtvQkFDQSxTQUFBLFVBQUEsQ0FBQSxLQUFBLE9BQUE7Ozs7O1lBS0EsS0FBQSxJQUFBLEtBQUEsT0FBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7Z0JBQ0EsSUFBQSxTQUFBLGVBQUEsS0FBQSxPQUFBLEdBQUEsS0FBQTtvQkFDQSxJQUFBLElBQUEsS0FBQSxPQUFBLElBQUEsWUFBQSxTQUFBLEtBQUEsT0FBQSxHQUFBO3VCQUNBO29CQUNBLElBQUEsSUFBQSxLQUFBLE9BQUEsSUFBQSxZQUFBOztvQkFFQSxLQUFBLE9BQUEsR0FBQSxPQUFBOzs7O1lBSUEsT0FBQTs7UUFFQSxZQUFBLFlBQUE7WUFDQSxPQUFBLEtBQUEsZUFBQTs7UUFFQSxlQUFBLFlBQUE7WUFDQSxPQUFBLEtBQUEsWUFBQSxXQUFBOzs7SUFHQSxTQUFBO1FBQ0EsVUFBQSxVQUFBLElBQUE7WUFDQSxPQUFBLEtBQUEsU0FBQSxlQUFBOztRQUVBLFVBQUEsVUFBQSxJQUFBO1lBQ0EsT0FBQSxLQUFBLFNBQUE7O1FBRUEsWUFBQSxVQUFBLE9BQUE7WUFDQSxJQUFBLFVBQUE7WUFDQSxPQUFBLE1BQUEsY0FBQSxNQUFBO2dCQUNBLFFBQUEsS0FBQSxTQUFBLE1BQUE7Z0JBQ0EsUUFBQSxRQUFBLE1BQUE7OztZQUdBLE9BQUE7O1FBRUEsWUFBQSxVQUFBLE9BQUE7WUFDQSxLQUFBLE1BQUEsVUFBQTs7UUFFQSxjQUFBLFVBQUEsT0FBQTtZQUNBLEtBQUEsTUFBQSxZQUFBOztRQUVBLFlBQUEsVUFBQSxPQUFBO1lBQ0EsS0FBQSxNQUFBLFVBQUE7O1FBRUEsYUFBQSxVQUFBLE9BQUE7WUFDQSxJQUFBLENBQUEsS0FBQSxhQUFBO2dCQUNBLEtBQUE7Ozs7O1lBS0EsSUFBQSxLQUFBLFNBQUEsTUFBQSxLQUFBO2dCQUNBLE1BQUEsV0FBQTtnQkFDQSxLQUFBLFlBQUE7Z0JBQ0EsSUFBQSxVQUFBLEtBQUEsV0FBQTtnQkFDQSxLQUFBLElBQUEsSUFBQSxRQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtvQkFDQSxLQUFBLFNBQUEsUUFBQSxJQUFBLE9BQUE7Ozs7UUFJQSxlQUFBLFVBQUEsT0FBQTtZQUNBLElBQUEsS0FBQSxTQUFBLE1BQUEsS0FBQTtnQkFDQSxNQUFBLFdBQUE7OztRQUdBLHFCQUFBLFlBQUE7WUFDQSxLQUFBLElBQUEsSUFBQSxLQUFBLE9BQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO2dCQUNBLEtBQUEsT0FBQSxHQUFBLFdBQUE7OztRQUdBLFVBQUEsWUFBQTtZQUNBLEtBQUEsWUFBQSxDQUFBLEtBQUE7OztJQUdBLFNBQUEsWUFBQTs7UUFFQSxLQUFBLElBQUEsS0FBQSxPQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtZQUNBLElBQUEsSUFBQSxLQUFBLE9BQUEsSUFBQSxRQUFBO1lBQ0EsSUFBQSxJQUFBLEtBQUEsT0FBQSxJQUFBLFlBQUE7Ozs7Ozs7UUFPQSxJQUFBLEtBQUEsWUFBQTtZQUNBLEtBQUEsSUFBQSxVQUFBLEtBQUE7WUFDQSxLQUFBLElBQUEsWUFBQSxLQUFBO2VBQ0E7WUFDQSxLQUFBLFFBQUEsSUFBQSxVQUFBLEtBQUE7WUFDQSxLQUFBLFFBQUEsSUFBQSxZQUFBLEtBQUE7WUFDQSxLQUFBLFFBQUEsSUFBQSxTQUFBLEtBQUE7Ozs7Ozs7Ozs7QUN0S0EsT0FBQSxXQUFBLHdDQUFBO0lBQ0EsTUFBQTtJQUNBLFVBQUE7UUFDQTtZQUNBO1lBQ0E7WUFDQTtnQkFDQTtZQUNBO1lBQ0E7UUFDQTtRQUNBO1lBQ0E7UUFDQTtJQUNBO0lBQ0EsTUFBQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLFdBQUE7OztJQUdBLE9BQUE7UUFDQSxPQUFBO1lBQ0EsTUFBQTtZQUNBLFVBQUE7O1FBRUEsZUFBQTtZQUNBLE1BQUE7WUFDQSxVQUFBOztRQUVBLFdBQUE7WUFDQSxNQUFBO1lBQ0EsU0FBQTs7O0lBR0EsVUFBQTtRQUNBLGFBQUEsWUFBQTtZQUNBLE9BQUE7Z0JBQ0EsOEJBQUEsS0FBQSxNQUFBO2dCQUNBLGdDQUFBLEtBQUEsTUFBQTs7O1FBR0EsWUFBQSxZQUFBO1lBQ0EsT0FBQTtnQkFDQSxvQkFBQSxNQUFBLEtBQUEsTUFBQTs7O1FBR0EsZ0JBQUEsWUFBQTtZQUNBLE9BQUE7Z0JBQ0Esd0JBQUEsQ0FBQSxLQUFBO2dCQUNBLGtCQUFBLEtBQUE7OztRQUdBLGFBQUEsWUFBQTtZQUNBLE9BQUEsa0JBQUEsS0FBQSxNQUFBOzs7SUFHQSxTQUFBO1FBQ0EsY0FBQSxZQUFBO1lBQ0EsSUFBQSxDQUFBLEtBQUEsTUFBQSxVQUFBO2dCQUNBLEtBQUEsTUFBQSxVQUFBLEtBQUE7bUJBQ0E7Z0JBQ0EsS0FBQSxNQUFBLFlBQUEsS0FBQTs7OztRQUlBLFlBQUEsWUFBQTtZQUNBLEtBQUEsV0FBQSxLQUFBOztRQUVBLFlBQUEsWUFBQTs7WUFFQSxJQUFBLENBQUEsS0FBQSxNQUFBLFVBQUE7Z0JBQ0EsS0FBQTttQkFDQTtnQkFDQSxLQUFBLE1BQUEsT0FBQSxDQUFBLEtBQUEsTUFBQTs7O1FBR0EsaUJBQUEsWUFBQTtZQUNBLEtBQUEsWUFBQSxDQUFBLEtBQUE7O1FBRUEsWUFBQSxVQUFBLE9BQUE7O1lBRUEsS0FBQSxNQUFBLFVBQUE7O1FBRUEsY0FBQSxVQUFBLE9BQUE7O1lBRUEsS0FBQSxNQUFBLFlBQUE7O1FBRUEsWUFBQSxVQUFBLE9BQUE7O1lBRUEsS0FBQSxNQUFBLFVBQUE7Ozs7Ozs7Ozs7QUN6RkEsT0FBQSxXQUFBLHdDQUFBO0lBQ0EsVUFBQTtJQUNBLE1BQUEsWUFBQTtRQUNBLE9BQUE7WUFDQSxVQUFBOzs7SUFHQSxZQUFBO1FBQ0EsV0FBQSxTQUFBOztJQUVBLE9BQUE7UUFDQSxRQUFBO1lBQ0EsTUFBQTtZQUNB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QkFDQSxLQUFBLE1BQUEsVUFBQSxLQUFBOzs7Ozs7Ozs7OztBQ2pEQSxPQUFBLFdBQUEsd0NBQUE7SUFDQSxPQUFBO1FBQ0EsUUFBQTtZQUNBLE1BQUE7WUFDQSxVQUFBOztRQUVBLE9BQUE7WUFDQSxNQUFBO1lBQ0EsU0FBQTs7UUFFQSxRQUFBO1lBQ0EsTUFBQTtZQUNBLFNBQUE7O1FBRUEsTUFBQTtZQUNBLE1BQUE7WUFDQSxTQUFBOzs7SUFHQSxZQUFBO1FBQ0EsZ0JBQUEsT0FBQSxTQUFBOztJQUVBLFVBQUE7UUFDQSxlQUFBO1lBQ0EsS0FBQSxZQUFBO2dCQUNBLE9BQUEsS0FBQTs7WUFFQSxLQUFBLFVBQUEsT0FBQTtnQkFDQSxLQUFBLE1BQUEsU0FBQTs7O1FBR0EsY0FBQTtZQUNBLEtBQUEsWUFBQTtnQkFDQSxPQUFBLEtBQUE7O1lBRUEsS0FBQSxVQUFBLE1BQUE7Z0JBQ0EsS0FBQSxNQUFBLFFBQUE7OztRQUdBLGdCQUFBLFlBQUE7WUFDQSxPQUFBLEtBQUEsU0FBQSxLQUFBLE9BQUEsT0FBQTs7UUFFQSxhQUFBLFlBQUE7WUFDQSxPQUFBLEtBQUEsT0FBQSxXQUFBOztRQUVBLGFBQUEsWUFBQTtZQUNBLE9BQUEsQ0FBQSxLQUFBOztRQUVBLFdBQUEsWUFBQTtZQUNBLE9BQUEsQ0FBQSxLQUFBOzs7SUFHQSxTQUFBO1FBQ0EsY0FBQSxZQUFBO1lBQ0EsS0FBQSxnQkFBQSxPQUFBLFNBQUE7O1FBRUEsYUFBQSxZQUFBO1lBQ0EsS0FBQSxNQUFBLFVBQUE7O1FBRUEsYUFBQSxVQUFBLE9BQUE7WUFDQSxLQUFBLE1BQUEsVUFBQTs7OztBQUlBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBuYW1lc3BhY2UgYmlpZ2xlLmxhYmVsLXRyZWVzXG4gKiBAZGVzY3JpcHRpb24gVGhlIEJJSUdMRSBsYWJlbCB0cmVlcyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdiaWlnbGUubGFiZWwtdHJlZXMnLCBbJ2JpaWdsZS5hcGknLCAnYmlpZ2xlLnVpJ10pO1xuXG4vKlxuICogRGlzYWJsZSBkZWJ1ZyBpbmZvIGluIHByb2R1Y3Rpb24gZm9yIGJldHRlciBwZXJmb3JtYW5jZS5cbiAqIHNlZTogaHR0cHM6Ly9jb2RlLmFuZ3VsYXJqcy5vcmcvMS40LjcvZG9jcy9ndWlkZS9wcm9kdWN0aW9uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdiaWlnbGUubGFiZWwtdHJlZXMnKS5jb25maWcoZnVuY3Rpb24gKCRjb21waWxlUHJvdmlkZXIpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICRjb21waWxlUHJvdmlkZXIuZGVidWdJbmZvRW5hYmxlZChmYWxzZSk7XG59KTtcbiIsIi8qKlxuICogVGhlIHBhbmVsIGZvciBlZGl0aW5nIHRoZSBsYWJlbHMgb2YgYSBsYWJlbCB0cmVlXG4gKi9cbmJpaWdsZS4kdmlld01vZGVsKCdsYWJlbC10cmVlcy1sYWJlbHMnLCBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgIHZhciBsYWJlbHMgPSBiaWlnbGUuJHJlcXVpcmUoJ2FwaS5sYWJlbHMnKTtcbiAgICB2YXIgbWVzc2FnZXMgPSBiaWlnbGUuJHJlcXVpcmUoJ21lc3NhZ2VzLnN0b3JlJyk7XG4gICAgdmFyIHJhbmRvbUNvbG9yID0gYmlpZ2xlLiRyZXF1aXJlKCdsYWJlbFRyZWVzLnJhbmRvbUNvbG9yJyk7XG4gICAgdmFyIGxhYmVsVHJlZSA9IGJpaWdsZS4kcmVxdWlyZSgnbGFiZWxUcmVlcy5sYWJlbFRyZWUnKTtcblxuICAgIG5ldyBWdWUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgZWRpdGluZzogZmFsc2UsXG4gICAgICAgICAgICBsb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGxhYmVsczogYmlpZ2xlLiRyZXF1aXJlKCdsYWJlbFRyZWVzLmxhYmVscycpLFxuICAgICAgICAgICAgc2VsZWN0ZWRDb2xvcjogcmFuZG9tQ29sb3IoKSxcbiAgICAgICAgICAgIHNlbGVjdGVkTGFiZWw6IG51bGwsXG4gICAgICAgICAgICBzZWxlY3RlZE5hbWU6ICcnLFxuICAgICAgICB9LFxuICAgICAgICBjb21wb25lbnRzOiB7XG4gICAgICAgICAgICB0eXBlYWhlYWQ6IFZ1ZVN0cmFwLnR5cGVhaGVhZCxcbiAgICAgICAgICAgIHRhYnM6IFZ1ZVN0cmFwLnRhYnMsXG4gICAgICAgICAgICB0YWI6IFZ1ZVN0cmFwLnRhYixcbiAgICAgICAgICAgIGxhYmVsVHJlZTogYmlpZ2xlLiRyZXF1aXJlKCdsYWJlbFRyZWVzLmNvbXBvbmVudHMubGFiZWxUcmVlJyksXG4gICAgICAgICAgICBtYW51YWxMYWJlbEZvcm06IGJpaWdsZS4kcmVxdWlyZSgnbGFiZWxUcmVlcy5jb21wb25lbnRzLm1hbnVhbExhYmVsRm9ybScpLFxuICAgICAgICAgICAgd29ybXNMYWJlbEZvcm06IGJpaWdsZS4kcmVxdWlyZSgnbGFiZWxUcmVlcy5jb21wb25lbnRzLndvcm1zTGFiZWxGb3JtJyksXG4gICAgICAgIH0sXG4gICAgICAgIGNvbXB1dGVkOiB7XG4gICAgICAgICAgICBjbGFzc09iamVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICdwYW5lbC13YXJuaW5nJzogdGhpcy5lZGl0aW5nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIG1ldGhvZHM6IHtcbiAgICAgICAgICAgIHRvZ2dsZUVkaXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVkaXRpbmcgPSAhdGhpcy5lZGl0aW5nO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0TG9hZGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmluaXNoTG9hZGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlbGV0ZUxhYmVsOiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydExvYWRpbmcoKTtcbiAgICAgICAgICAgICAgICBsYWJlbHMuZGVsZXRlKHtpZDogbGFiZWwuaWR9KVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmxhYmVsRGVsZXRlZChsYWJlbCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIG1lc3NhZ2VzLmhhbmRsZUVycm9yUmVzcG9uc2UpXG4gICAgICAgICAgICAgICAgICAgIC5maW5hbGx5KHRoaXMuZmluaXNoTG9hZGluZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGFiZWxEZWxldGVkOiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZExhYmVsICYmIHRoaXMuc2VsZWN0ZWRMYWJlbC5pZCA9PT0gbGFiZWwuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXNlbGVjdExhYmVsKGxhYmVsKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5sYWJlbHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubGFiZWxzW2ldLmlkID09PSBsYWJlbC5pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sYWJlbHMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2VsZWN0TGFiZWw6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRMYWJlbCA9IGxhYmVsO1xuICAgICAgICAgICAgICAgIGlmICghbGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kZW1pdCgnY2xlYXInKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkQ29sb3IgPSAnIycgKyBsYWJlbC5jb2xvcjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kZW1pdCgnc2VsZWN0JywgbGFiZWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZXNlbGVjdExhYmVsOiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkTGFiZWwgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuJGVtaXQoJ2Rlc2VsZWN0JywgbGFiZWwpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNlbGVjdENvbG9yOiBmdW5jdGlvbiAoY29sb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkQ29sb3IgPSBjb2xvcjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZWxlY3ROYW1lOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWROYW1lID0gbmFtZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbnNlcnRMYWJlbDogZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgVnVlLnNldChsYWJlbCwgJ29wZW4nLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgVnVlLnNldChsYWJlbCwgJ3NlbGVjdGVkJywgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gbGFiZWwubmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIC8vIGFkZCB0aGUgbGFiZWwgdG8gdGhlIGFycmF5IHNvIHRoZSBsYWJlbHMgcmVtYWluIHNvcnRlZCBieSB0aGVpciBuYW1lXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IHRoaXMubGFiZWxzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmxhYmVsc1tpXS5uYW1lLnRvTG93ZXJDYXNlKCkgPj0gbmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sYWJlbHMuc3BsaWNlKGksIDAsIGxhYmVsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgZnVuY3Rpb24gZGlkbid0IHJldHVybiBieSBub3cgdGhlIGxhYmVsIGlzIFwic21hbGxlclwiIHRoYW4gYWxsXG4gICAgICAgICAgICAgICAgLy8gdGhlIG90aGVyIGxhYmVscy5cbiAgICAgICAgICAgICAgICB0aGlzLmxhYmVscy5wdXNoKGxhYmVsKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVMYWJlbDogZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubG9hZGluZykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydExvYWRpbmcoKTtcbiAgICAgICAgICAgICAgICBsYWJlbHMuc2F2ZSh7bGFiZWxfdHJlZV9pZDogbGFiZWxUcmVlLmlkfSwgbGFiZWwpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKHRoaXMubGFiZWxDcmVhdGVkLCBtZXNzYWdlcy5oYW5kbGVFcnJvclJlc3BvbnNlKVxuICAgICAgICAgICAgICAgICAgICAuZmluYWxseSh0aGlzLmZpbmlzaExvYWRpbmcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhYmVsQ3JlYXRlZDogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5mb3JFYWNoKHRoaXMuaW5zZXJ0TGFiZWwpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRDb2xvciA9IHJhbmRvbUNvbG9yKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZE5hbWUgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG4iLCIvKipcbiAqIEZ1bmN0aW9uIHJldHVybmluZyBhIHJhbmRvbSBjb2xvclxuICovXG5iaWlnbGUuJGRlY2xhcmUoJ2xhYmVsVHJlZXMucmFuZG9tQ29sb3InLCBmdW5jdGlvbiAoKSB7XG4gICAgLy8gSFNWIHZhbHVlc1xuICAgIHZhciBNSU4gPSBbMCwgMC41LCAwLjldO1xuICAgIHZhciBNQVggPSBbMzYwLCAxLCAxXTtcblxuICAgIC8vIG51bWJlciBvZiBkZWNpbWFscyB0byBrZWVwXG4gICAgdmFyIFBSRUNJU0lPTiA9IFswLCAyLCAyXTtcblxuICAgIC8vIHNlZSBodHRwczovL2RlLndpa2lwZWRpYS5vcmcvd2lraS9IU1YtRmFyYnJhdW0jVHJhbnNmb3JtYXRpb25fdm9uX1JHQl91bmRfSFNWLjJGSFNMXG4gICAgdmFyIHRvUmdiID0gZnVuY3Rpb24gKGhzdikge1xuICAgICAgICB2YXIgdG1wID0gaHN2WzBdIC8gNjA7XG4gICAgICAgIHZhciBoaSA9IE1hdGguZmxvb3IodG1wKTtcbiAgICAgICAgdmFyIGYgPSB0bXAgLSBoaTtcbiAgICAgICAgdmFyIHBxdCA9IFtcbiAgICAgICAgICAgIGhzdlsyXSAqICgxIC0gaHN2WzFdKSxcbiAgICAgICAgICAgIGhzdlsyXSAqICgxIC0gaHN2WzFdICogZiksXG4gICAgICAgICAgICBoc3ZbMl0gKiAoMSAtIGhzdlsxXSAqICgxIC0gZikpXG4gICAgICAgIF07XG5cbiAgICAgICAgdmFyIHJnYjtcblxuICAgICAgICBzd2l0Y2ggKGhpKSB7XG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgcmdiID0gW3BxdFsxXSwgaHN2WzJdLCBwcXRbMF1dO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgIHJnYiA9IFtwcXRbMF0sIGhzdlsyXSwgcHF0WzJdXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICByZ2IgPSBbcHF0WzBdLCBwcXRbMV0sIGhzdlsyXV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgcmdiID0gW3BxdFsyXSwgcHF0WzBdLCBoc3ZbMl1dO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgICAgIHJnYiA9IFtoc3ZbMl0sIHBxdFswXSwgcHF0WzFdXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmdiID0gW2hzdlsyXSwgcHF0WzJdLCBwcXRbMF1dO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJnYi5tYXAoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoaXRlbSAqIDI1NSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB2YXIgdG9IZXggPSBmdW5jdGlvbiAocmdiKSB7XG4gICAgICAgIHJldHVybiByZ2IubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICBpdGVtID0gaXRlbS50b1N0cmluZygxNik7XG4gICAgICAgICAgICByZXR1cm4gKGl0ZW0ubGVuZ3RoID09PSAxKSA/ICgnMCcgKyBpdGVtKSA6IGl0ZW07XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY29sb3IgPSBbMCwgMCwgMF07XG4gICAgICAgIHZhciBwcmVjaXNpb247XG4gICAgICAgIGZvciAodmFyIGkgPSBjb2xvci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgcHJlY2lzaW9uID0gMTAgKiBQUkVDSVNJT05baV07XG4gICAgICAgICAgICBjb2xvcltpXSA9IChNQVhbaV0gLSBNSU5baV0pICogTWF0aC5yYW5kb20oKSArIE1JTltpXTtcbiAgICAgICAgICAgIGlmIChwcmVjaXNpb24gIT09IDApIHtcbiAgICAgICAgICAgICAgICBjb2xvcltpXSA9IE1hdGgucm91bmQoY29sb3JbaV0gKiBwcmVjaXNpb24pIC8gcHJlY2lzaW9uO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb2xvcltpXSA9IE1hdGgucm91bmQoY29sb3JbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICcjJyArIHRvSGV4KHRvUmdiKGNvbG9yKSkuam9pbignJyk7XG4gICAgfTtcbn0pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEF1dGhvcml6ZWRQcm9qZWN0c0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBiaWlnbGUubGFiZWwtdHJlZXNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgdGhlIGF1dG9yaXplZCBwcm9qZWN0cyBvZiBhIGxhYmVsIHRyZWVcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2JpaWdsZS5sYWJlbC10cmVlcycpLmNvbnRyb2xsZXIoJ0F1dGhvcml6ZWRQcm9qZWN0c0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBMQUJFTF9UUkVFLCBBVVRIX1BST0pFQ1RTLCBBVVRIX09XTl9QUk9KRUNUUywgUHJvamVjdCwgTGFiZWxUcmVlQXV0aG9yaXplZFByb2plY3QpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIGVkaXRpbmcgPSBmYWxzZTtcbiAgICAgICAgdmFyIGxvYWRpbmcgPSBmYWxzZTtcblxuICAgICAgICB2YXIgb3duUHJvamVjdHMgPSBudWxsO1xuXG4gICAgICAgIC8vIGFsbCBwcm9qZWN0cyB0aGUgY3VycmVudCB1c2VyIGJlbG9uZ3MgdG8gYW5kIHRoYXQgYXJlIG5vdCBhbHJlYWR5IGF1dGhvcml6ZWRcbiAgICAgICAgdmFyIHByb2plY3RzRm9yQXV0aG9yaXphdGlvbiA9IG51bGw7XG5cbiAgICAgICAgdmFyIHByb2plY3RJc05vdEF1dGhvcml6ZWQgPSBmdW5jdGlvbiAocHJvamVjdCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IEFVVEhfUFJPSkVDVFMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoQVVUSF9QUk9KRUNUU1tpXS5pZCA9PT0gcHJvamVjdC5pZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgdXBkYXRlUHJvamVjdHNGb3JBdXRob3JpemF0aW9uID0gZnVuY3Rpb24gKHByb2plY3RzKSB7XG4gICAgICAgICAgICBwcm9qZWN0c0ZvckF1dGhvcml6YXRpb24gPSBwcm9qZWN0cy5maWx0ZXIocHJvamVjdElzTm90QXV0aG9yaXplZCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZUVycm9yID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBtc2cucmVzcG9uc2VFcnJvcihyZXNwb25zZSk7XG4gICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHByb2plY3RBZGRlZCA9IGZ1bmN0aW9uIChwcm9qZWN0KSB7XG4gICAgICAgICAgICBBVVRIX1BST0pFQ1RTLnB1c2gocHJvamVjdCk7XG4gICAgICAgICAgICAvLyB1c2VyIGNhbiBvbmx5IGF1dGhvcml6ZSBvd24gcHJvamVjdHNcbiAgICAgICAgICAgIEFVVEhfT1dOX1BST0pFQ1RTLnB1c2gocHJvamVjdC5pZCk7XG4gICAgICAgICAgICB1cGRhdGVQcm9qZWN0c0ZvckF1dGhvcml6YXRpb24ob3duUHJvamVjdHMpO1xuICAgICAgICAgICAgbG9hZGluZyA9IGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBwcm9qZWN0UmVtb3ZlZCA9IGZ1bmN0aW9uIChwcm9qZWN0KSB7XG4gICAgICAgICAgICB2YXIgaTtcbiAgICAgICAgICAgIGZvciAoaSA9IEFVVEhfUFJPSkVDVFMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoQVVUSF9QUk9KRUNUU1tpXS5pZCA9PT0gcHJvamVjdC5pZCkge1xuICAgICAgICAgICAgICAgICAgICBBVVRIX1BST0pFQ1RTLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpID0gQVVUSF9PV05fUFJPSkVDVFMuaW5kZXhPZihwcm9qZWN0LmlkKTtcbiAgICAgICAgICAgIGlmIChpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIEFVVEhfT1dOX1BST0pFQ1RTLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdXBkYXRlUHJvamVjdHNGb3JBdXRob3JpemF0aW9uKG93blByb2plY3RzKTtcbiAgICAgICAgICAgIGxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaGFzUHJvamVjdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gQVVUSF9QUk9KRUNUUy5sZW5ndGggPiAwO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5nZXRQcm9qZWN0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBBVVRIX1BST0pFQ1RTO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc093blByb2plY3QgPSBmdW5jdGlvbiAocHJvamVjdCkge1xuICAgICAgICAgICAgcmV0dXJuIEFVVEhfT1dOX1BST0pFQ1RTLmluZGV4T2YocHJvamVjdC5pZCkgIT09IC0xO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc0VkaXRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZWRpdGluZztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0VmlzaWJpbGl0eUlkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIExBQkVMX1RSRUUudmlzaWJpbGl0eV9pZDtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUudG9nZ2xlRWRpdGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghb3duUHJvamVjdHMpIHtcbiAgICAgICAgICAgICAgICBvd25Qcm9qZWN0cyA9IFByb2plY3QucXVlcnkodXBkYXRlUHJvamVjdHNGb3JBdXRob3JpemF0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWRpdGluZyA9ICFlZGl0aW5nO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc0xvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9hZGluZztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0UHJvamVjdHNGb3JBdXRob3JpemF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHByb2plY3RzRm9yQXV0aG9yaXphdGlvbjtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuYWRkQXV0aG9yaXplZFByb2plY3QgPSBmdW5jdGlvbiAocHJvamVjdCkge1xuICAgICAgICAgICAgbG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICBMYWJlbFRyZWVBdXRob3JpemVkUHJvamVjdC5hZGRBdXRob3JpemVkKFxuICAgICAgICAgICAgICAgIHtpZDogTEFCRUxfVFJFRS5pZH0sXG4gICAgICAgICAgICAgICAge2lkOiBwcm9qZWN0LmlkfSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb2plY3RBZGRlZChwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGhhbmRsZUVycm9yXG4gICAgICAgICAgICApO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5yZW1vdmVBdXRob3JpemVkUHJvamVjdCA9IGZ1bmN0aW9uIChwcm9qZWN0KSB7XG4gICAgICAgICAgICBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIExhYmVsVHJlZUF1dGhvcml6ZWRQcm9qZWN0LnJlbW92ZUF1dGhvcml6ZWQoXG4gICAgICAgICAgICAgICAge2lkOiBMQUJFTF9UUkVFLmlkfSxcbiAgICAgICAgICAgICAgICB7aWQ6IHByb2plY3QuaWR9LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvamVjdFJlbW92ZWQocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBoYW5kbGVFcnJvclxuICAgICAgICAgICAgKTtcbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIExhYmVsVHJlZUNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBiaWlnbGUubGFiZWwtdHJlZXNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgbGFiZWwgdHJlZSBpbmZvcm1hdGlvblxuICovXG5hbmd1bGFyLm1vZHVsZSgnYmlpZ2xlLmxhYmVsLXRyZWVzJykuY29udHJvbGxlcignTGFiZWxUcmVlQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICBMQUJFTF9UUkVFLCBMYWJlbFRyZWUsIG1zZywgJHRpbWVvdXQsIExhYmVsVHJlZVVzZXIsIFVTRVJfSUQsIFJFRElSRUNUX1VSTCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgZWRpdGluZyA9IGZhbHNlO1xuICAgICAgICB2YXIgc2F2aW5nID0gZmFsc2U7XG5cbiAgICAgICAgJHNjb3BlLmxhYmVsVHJlZUluZm8gPSB7XG4gICAgICAgICAgICBuYW1lOiBMQUJFTF9UUkVFLm5hbWUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogTEFCRUxfVFJFRS5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgIHZpc2liaWxpdHlfaWQ6IExBQkVMX1RSRUUudmlzaWJpbGl0eV9pZC50b1N0cmluZygpXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZVNhdmluZ0Vycm9yID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBtc2cucmVzcG9uc2VFcnJvcihyZXNwb25zZSk7XG4gICAgICAgICAgICBzYXZpbmcgPSBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaW5mb1VwZGF0ZWQgPSBmdW5jdGlvbiAodHJlZSkge1xuICAgICAgICAgICAgTEFCRUxfVFJFRS5uYW1lID0gdHJlZS5uYW1lO1xuICAgICAgICAgICAgTEFCRUxfVFJFRS5kZXNjcmlwdGlvbiA9IHRyZWUuZGVzY3JpcHRpb247XG4gICAgICAgICAgICBMQUJFTF9UUkVFLnZpc2liaWxpdHlfaWQgPSBwYXJzZUludCh0cmVlLnZpc2liaWxpdHlfaWQpO1xuICAgICAgICAgICAgZWRpdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgc2F2aW5nID0gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHRyZWVEZWxldGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbXNnLnN1Y2Nlc3MoJ1RoZSBsYWJlbCB0cmVlIHdhcyBkZWxldGVkLiBSZWRpcmVjdGluZy4uLicpO1xuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gUkVESVJFQ1RfVVJMO1xuICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciB1c2VyTGVmdCA9IGZ1bmN0aW9uIChyZWRpcmVjdCkge1xuICAgICAgICAgICAgaWYgKHJlZGlyZWN0KSB7XG4gICAgICAgICAgICAgICAgbXNnLnN1Y2Nlc3MoJ1lvdSBsZWZ0IHRoZSBsYWJlbCB0cmVlLiBSZWRpcmVjdGluZy4uLicpO1xuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBSRURJUkVDVF9VUkw7XG4gICAgICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtc2cuc3VjY2VzcygnWW91IGxlZnQgdGhlIGxhYmVsIHRyZWUuIFJlbG9hZGluZy4uLicpO1xuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNFZGl0aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGVkaXRpbmc7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnRvZ2dsZUVkaXRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBlZGl0aW5nID0gIWVkaXRpbmc7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzU2F2aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHNhdmluZztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0VmlzaWJpbGl0eUlkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIExBQkVMX1RSRUUudmlzaWJpbGl0eV9pZDtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0TmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBMQUJFTF9UUkVFLm5hbWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldERlc2NyaXB0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIExBQkVMX1RSRUUuZGVzY3JpcHRpb247XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnNhdmVDaGFuZ2VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2F2aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIExhYmVsVHJlZS51cGRhdGUoe1xuICAgICAgICAgICAgICAgIGlkOiBMQUJFTF9UUkVFLmlkLFxuICAgICAgICAgICAgICAgIG5hbWU6ICRzY29wZS5sYWJlbFRyZWVJbmZvLm5hbWUsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICRzY29wZS5sYWJlbFRyZWVJbmZvLmRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgIHZpc2liaWxpdHlfaWQ6IHBhcnNlSW50KCRzY29wZS5sYWJlbFRyZWVJbmZvLnZpc2liaWxpdHlfaWQpXG4gICAgICAgICAgICB9LCBpbmZvVXBkYXRlZCwgaGFuZGxlU2F2aW5nRXJyb3IpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5kaXNjYXJkQ2hhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5sYWJlbFRyZWVJbmZvLm5hbWUgPSBMQUJFTF9UUkVFLm5hbWU7XG4gICAgICAgICAgICAkc2NvcGUubGFiZWxUcmVlSW5mby5kZXNjcmlwdGlvbiA9IExBQkVMX1RSRUUuZGVzY3JpcHRpb247XG4gICAgICAgICAgICAkc2NvcGUubGFiZWxUcmVlSW5mby52aXNpYmlsaXR5X2lkID0gTEFCRUxfVFJFRS52aXNpYmlsaXR5X2lkLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBlZGl0aW5nID0gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmRlbGV0ZVRyZWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoY29uZmlybSgnRG8geW91IHJlYWxseSB3YW50IHRvIGRlbGV0ZSB0aGUgbGFiZWwgdHJlZSAnICsgTEFCRUxfVFJFRS5uYW1lICsgJz8nKSkge1xuICAgICAgICAgICAgICAgIExhYmVsVHJlZS5kZWxldGUoe2lkOiBMQUJFTF9UUkVFLmlkfSwgdHJlZURlbGV0ZWQsIG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUubGVhdmVUcmVlID0gZnVuY3Rpb24gKHJlZGlyZWN0KSB7XG4gICAgICAgICAgICAvLyByZWRpcmVjdCBpZiB0aGUgdHJlZSBpcyBwcml2YXRlLCBvdGhlcndpc2UgcmVsb2FkXG4gICAgICAgICAgICBpZiAoY29uZmlybSgnRG8geW91IHJlYWxseSB3YW50IHRvIGxlYXZlIHRoZSBsYWJlbCB0cmVlICcgKyBMQUJFTF9UUkVFLm5hbWUgKyAnPycpKSB7XG4gICAgICAgICAgICAgICAgTGFiZWxUcmVlVXNlci5kZXRhY2goXG4gICAgICAgICAgICAgICAgICAgIHtsYWJlbF90cmVlX2lkOiBMQUJFTF9UUkVFLmlkfSxcbiAgICAgICAgICAgICAgICAgICAge2lkOiBVU0VSX0lEfSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXNlckxlZnQocmVkaXJlY3QpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBtc2cucmVzcG9uc2VFcnJvclxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBiaWlnbGUubGFiZWwtdHJlZXNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBNZW1iZXJzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSB0aGUgbWVtYmVycyBvZiBhIGxhYmVsIHRyZWVcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2JpaWdsZS5sYWJlbC10cmVlcycpLmNvbnRyb2xsZXIoJ01lbWJlcnNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgTEFCRUxfVFJFRSwgTUVNQkVSUywgUk9MRVMsIERFRkFVTFRfUk9MRV9JRCwgVVNFUl9JRCwgTGFiZWxUcmVlVXNlciwgbXNnLCBVc2VyKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBlZGl0aW5nID0gZmFsc2U7XG4gICAgICAgIHZhciBsb2FkaW5nID0gZmFsc2U7XG5cbiAgICAgICAgJHNjb3BlLm5ld01lbWJlciA9IHtcbiAgICAgICAgICAgIHVzZXI6IG51bGwsXG4gICAgICAgICAgICByb2xlX2lkOiBERUZBVUxUX1JPTEVfSUQudG9TdHJpbmcoKVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBoYW5kbGVFcnJvciA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgbXNnLnJlc3BvbnNlRXJyb3IocmVzcG9uc2UpO1xuICAgICAgICAgICAgbG9hZGluZyA9IGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciByb2xlVXBkYXRlZCA9IGZ1bmN0aW9uIChtZW1iZXIpIHtcbiAgICAgICAgICAgIG1lbWJlci5yb2xlX2lkID0gcGFyc2VJbnQobWVtYmVyLnRtcF9yb2xlX2lkKTtcbiAgICAgICAgICAgIGxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcm9sZVVwZGF0ZUZhaWxlZCA9IGZ1bmN0aW9uIChtZW1iZXIsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBtZW1iZXIudG1wX3JvbGVfaWQgPSBtZW1iZXIucm9sZV9pZC50b1N0cmluZygpO1xuICAgICAgICAgICAgaGFuZGxlRXJyb3IocmVzcG9uc2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBtZW1iZXJSZW1vdmVkID0gZnVuY3Rpb24gKG1lbWJlcikge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IE1FTUJFUlMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoTUVNQkVSU1tpXS5pZCA9PT0gbWVtYmVyLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgIE1FTUJFUlMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHVzZXJJc05vTWVtYmVyID0gZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBNRU1CRVJTLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKE1FTUJFUlNbaV0uaWQgPT09IHVzZXIuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGZpbHRlck1lbWJlcnNGcm9tVXNlcnMgPSBmdW5jdGlvbiAodXNlcnMpIHtcbiAgICAgICAgICAgIHJldHVybiB1c2Vycy5maWx0ZXIodXNlcklzTm9NZW1iZXIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBtZW1iZXJBdHRhY2hlZCA9IGZ1bmN0aW9uIChtZW1iZXIpIHtcbiAgICAgICAgICAgIG1lbWJlci50bXBfcm9sZV9pZCA9IG1lbWJlci5yb2xlX2lkLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBNRU1CRVJTLnB1c2gobWVtYmVyKTtcbiAgICAgICAgICAgICRzY29wZS5uZXdNZW1iZXIudXNlciA9IG51bGw7XG4gICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzRWRpdGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBlZGl0aW5nO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS50b2dnbGVFZGl0aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZWRpdGluZyA9ICFlZGl0aW5nO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc0xvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9hZGluZztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0TWVtYmVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBNRU1CRVJTO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5oYXNNZW1iZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIE1FTUJFUlMubGVuZ3RoID4gMDtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0Um9sZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gUk9MRVM7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldFJvbGUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBST0xFU1tpZF07XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzT3duVXNlciA9IGZ1bmN0aW9uIChtZW1iZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBVU0VSX0lEID09PSBtZW1iZXIuaWQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnVwZGF0ZVJvbGUgPSBmdW5jdGlvbiAobWVtYmVyKSB7XG4gICAgICAgICAgICBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIExhYmVsVHJlZVVzZXIudXBkYXRlKFxuICAgICAgICAgICAgICAgIHtsYWJlbF90cmVlX2lkOiBMQUJFTF9UUkVFLmlkfSxcbiAgICAgICAgICAgICAgICB7aWQ6IG1lbWJlci5pZCwgcm9sZV9pZDogcGFyc2VJbnQobWVtYmVyLnRtcF9yb2xlX2lkKX0sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByb2xlVXBkYXRlZChtZW1iZXIpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJvbGVVcGRhdGVGYWlsZWQobWVtYmVyLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZGV0YWNoTWVtYmVyID0gZnVuY3Rpb24gKG1lbWJlcikge1xuICAgICAgICAgICAgbG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICBMYWJlbFRyZWVVc2VyLmRldGFjaChcbiAgICAgICAgICAgICAgICB7bGFiZWxfdHJlZV9pZDogTEFCRUxfVFJFRS5pZH0sXG4gICAgICAgICAgICAgICAge2lkOiBtZW1iZXIuaWR9LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVtYmVyUmVtb3ZlZChtZW1iZXIpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaGFuZGxlRXJyb3JcbiAgICAgICAgICAgICk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnVzZXJuYW1lID0gZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIGlmICh1c2VyICYmIHVzZXIuZmlyc3RuYW1lICYmIHVzZXIubGFzdG5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXNlci5maXJzdG5hbWUgKyAnICcgKyB1c2VyLmxhc3RuYW1lO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmZpbmRVc2VyID0gZnVuY3Rpb24gKHF1ZXJ5KSB7XG4gICAgICAgICAgICByZXR1cm4gVXNlci5maW5kKHtxdWVyeTogZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5KX0pLiRwcm9taXNlXG4gICAgICAgICAgICAgICAgLnRoZW4oZmlsdGVyTWVtYmVyc0Zyb21Vc2Vycyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLm5ld01lbWJlclZhbGlkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5uZXdNZW1iZXIudXNlciAmJlxuICAgICAgICAgICAgICAgICRzY29wZS5uZXdNZW1iZXIudXNlci5pZCAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICAgICAgdXNlcklzTm9NZW1iZXIoJHNjb3BlLm5ld01lbWJlci51c2VyKSAmJlxuICAgICAgICAgICAgICAgICRzY29wZS5uZXdNZW1iZXIucm9sZV9pZCAhPT0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuYXR0YWNoTWVtYmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCEkc2NvcGUubmV3TWVtYmVyVmFsaWQoKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhciBtZW1iZXIgPSAkc2NvcGUubmV3TWVtYmVyLnVzZXI7XG4gICAgICAgICAgICAvLyBvdmVyd3JpdGUgZ2xvYmFsIHJvbGVfaWQgcmV0dXJuZWQgZnJvbSBVc2VyLmZpbmQoKSB3aXRoIGxhYmVsIHRyZWUgcm9sZV9pZFxuICAgICAgICAgICAgbWVtYmVyLnJvbGVfaWQgPSBwYXJzZUludCgkc2NvcGUubmV3TWVtYmVyLnJvbGVfaWQpO1xuXG4gICAgICAgICAgICBMYWJlbFRyZWVVc2VyLmF0dGFjaChcbiAgICAgICAgICAgICAgICB7bGFiZWxfdHJlZV9pZDogTEFCRUxfVFJFRS5pZH0sXG4gICAgICAgICAgICAgICAge2lkOiBtZW1iZXIuaWQsIHJvbGVfaWQ6IG1lbWJlci5yb2xlX2lkfSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lbWJlckF0dGFjaGVkKG1lbWJlcik7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBoYW5kbGVFcnJvclxuICAgICAgICAgICAgKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBjb252ZXJ0IHJvbGUgSURzIHRvIHN0cmluZyBzbyB0aGV5IGNhbiBiZSBzZWxlY3RlZCBpbiBhIHNlbGVjdCBpbnB1dCBmaWVsZFxuICAgICAgICAvLyBhbHNvIGFkZCBpdCBhcyB0bXBfcm9sZV9pZCBzbyB0aGUgSUQgY2FuIGJlIHJlc2V0IGlmIHRoZSBjaGFuZ2UgZmFpbGVkXG4gICAgICAgIGZvciAodmFyIGkgPSBNRU1CRVJTLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBNRU1CRVJTW2ldLnRtcF9yb2xlX2lkID0gTUVNQkVSU1tpXS5yb2xlX2lkLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgbGFiZWxUcmVlSXRlbVxuICogQG1lbWJlck9mIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQGRlc2NyaXB0aW9uIEEgbGFiZWwgdHJlZSBpdGVtLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnYmlpZ2xlLmxhYmVsLXRyZWVzJykuZGlyZWN0aXZlKCdsYWJlbFRyZWVJdGVtJywgZnVuY3Rpb24gKCRjb21waWxlLCAkdGltZW91dCwgJHRlbXBsYXRlQ2FjaGUpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQycsXG5cbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnbGFiZWwtaXRlbS5odG1sJyxcblxuICAgICAgICAgICAgc2NvcGU6IHRydWUsXG5cbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAvLyB3YWl0IGZvciB0aGlzIGVsZW1lbnQgdG8gYmUgcmVuZGVyZWQgdW50aWwgdGhlIGNoaWxkcmVuIGFyZVxuICAgICAgICAgICAgICAgIC8vIGFwcGVuZGVkLCBvdGhlcndpc2UgdGhlcmUgd291bGQgYmUgdG9vIG11Y2ggcmVjdXJzaW9uIGZvclxuICAgICAgICAgICAgICAgIC8vIGFuZ3VsYXJcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IGFuZ3VsYXIuZWxlbWVudCgkdGVtcGxhdGVDYWNoZS5nZXQoJ2xhYmVsLXN1YnRyZWUuaHRtbCcpKTtcbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kKCRjb21waWxlKGNvbnRlbnQpKHNjb3BlKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgLy8gb3BlbiB0aGUgc3VidHJlZSBvZiB0aGlzIGl0ZW1cbiAgICAgICAgICAgICAgICB2YXIgb3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXRlbSBoYXMgY2hpbGRyZW5cbiAgICAgICAgICAgICAgICB2YXIgZXhwYW5kYWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXRlbSBpcyBjdXJyZW50bHkgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICB2YXIgc2VsZWN0ZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIHZhciBjaGVja1N0YXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLm9wZW5IaWVyYXJjaHkuaW5kZXhPZigkc2NvcGUuaXRlbS5pZCkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoJHNjb3BlLmlzU2VsZWN0ZWRMYWJlbCgkc2NvcGUuaXRlbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB2YXIgY2hlY2tFeHBhbmRhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBleHBhbmRhYmxlID0gJHNjb3BlLnRyZWUgJiYgJHNjb3BlLnRyZWUuaGFzT3duUHJvcGVydHkoJHNjb3BlLml0ZW0uaWQpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAkc2NvcGUuZ2V0U3VidHJlZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkc2NvcGUudHJlZVskc2NvcGUuaXRlbS5pZF07XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgfTtcblxuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmdldENsYXNzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3Blbjogb3BlbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cGFuZGFibGU6IGV4cGFuZGFibGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZDogc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignbGFiZWxzLnNlbGVjdGVkJywgY2hlY2tTdGF0ZSk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignbGFiZWxzLnJlZnJlc2gnLCBjaGVja0V4cGFuZGFibGUpO1xuICAgICAgICAgICAgICAgIGNoZWNrU3RhdGUoKTtcbiAgICAgICAgICAgICAgICBjaGVja0V4cGFuZGFibGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGJpaWdsZS5hdGVcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSByYW5jb21Db2xvclxuICogQG1lbWJlck9mIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIGEgbWFjaGFuaXNtIGZvciByYW5kb20gY29sb3JzXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdiaWlnbGUubGFiZWwtdHJlZXMnKS5zZXJ2aWNlKCdyYW5kb21Db2xvcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgLy8gSFNWIHZhbHVlc1xuICAgICAgICB2YXIgTUlOID0gWzAsIDAuNSwgMC45XTtcbiAgICAgICAgdmFyIE1BWCA9IFszNjAsIDEsIDFdO1xuXG4gICAgICAgIC8vIG51bWJlciBvZiBkZWNpbWFscyB0byBrZWVwXG4gICAgICAgIHZhciBQUkVDSVNJT04gPSBbMCwgMiwgMl07XG5cbiAgICAgICAgLy8gc2VlIGh0dHBzOi8vZGUud2lraXBlZGlhLm9yZy93aWtpL0hTVi1GYXJicmF1bSNUcmFuc2Zvcm1hdGlvbl92b25fUkdCX3VuZF9IU1YuMkZIU0xcbiAgICAgICAgdmFyIHRvUmdiID0gZnVuY3Rpb24gKGhzdikge1xuXG4gICAgICAgICAgICB2YXIgdG1wID0gaHN2WzBdIC8gNjA7XG4gICAgICAgICAgICB2YXIgaGkgPSBNYXRoLmZsb29yKHRtcCk7XG4gICAgICAgICAgICB2YXIgZiA9IHRtcCAtIGhpO1xuICAgICAgICAgICAgdmFyIHBxdCA9IFtcbiAgICAgICAgICAgICAgICBoc3ZbMl0gKiAoMSAtIGhzdlsxXSksXG4gICAgICAgICAgICAgICAgaHN2WzJdICogKDEgLSBoc3ZbMV0gKiBmKSxcbiAgICAgICAgICAgICAgICBoc3ZbMl0gKiAoMSAtIGhzdlsxXSAqICgxIC0gZikpXG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICB2YXIgcmdiO1xuXG4gICAgICAgICAgICBzd2l0Y2ggKGhpKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgICAgICByZ2IgPSBbcHF0WzFdLCBoc3ZbMl0sIHBxdFswXV07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgICAgcmdiID0gW3BxdFswXSwgaHN2WzJdLCBwcXRbMl1dO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgICAgIHJnYiA9IFtwcXRbMF0sIHBxdFsxXSwgaHN2WzJdXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgICAgICByZ2IgPSBbcHF0WzJdLCBwcXRbMF0sIGhzdlsyXV07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgNTpcbiAgICAgICAgICAgICAgICAgICAgcmdiID0gW2hzdlsyXSwgcHF0WzBdLCBwcXRbMV1dO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICByZ2IgPSBbaHN2WzJdLCBwcXRbMl0sIHBxdFswXV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZ2IubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChpdGVtICogMjU1KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciB0b0hleCA9IGZ1bmN0aW9uIChyZ2IpIHtcbiAgICAgICAgICAgIHJldHVybiByZ2IubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgaXRlbSA9IGl0ZW0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgIHJldHVybiAoaXRlbS5sZW5ndGggPT09IDEpID8gKCcwJyArIGl0ZW0pIDogaXRlbTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNvbG9yID0gWzAsIDAsIDBdO1xuICAgICAgICAgICAgdmFyIHByZWNpc2lvbjtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBjb2xvci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIHByZWNpc2lvbiA9IDEwICogUFJFQ0lTSU9OW2ldO1xuICAgICAgICAgICAgICAgIGNvbG9yW2ldID0gKE1BWFtpXSAtIE1JTltpXSkgKiBNYXRoLnJhbmRvbSgpICsgTUlOW2ldO1xuICAgICAgICAgICAgICAgIGlmIChwcmVjaXNpb24gIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29sb3JbaV0gPSBNYXRoLnJvdW5kKGNvbG9yW2ldICogcHJlY2lzaW9uKSAvIHByZWNpc2lvbjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb2xvcltpXSA9IE1hdGgucm91bmQoY29sb3JbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICcjJyArIHRvSGV4KHRvUmdiKGNvbG9yKSkuam9pbignJyk7XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogUmVzb3VyY2UgZm9yIGZpbmRpbmcgbGFiZWxzIGZyb20gYW4gZXh0ZXJuYWwgc291cmNlLlxuICpcbiAqIHZhciByZXNvdXJjZSA9IGJpaWdsZS4kcmVxdWlyZSgnYXBpLmxhYmVsU291cmNlJyk7XG4gKlxuICogRmluZCBsYWJlbHM6XG4gKlxuICogcmVzb3VyY2UucXVlcnkoe2lkOiAxLCBxdWVyeTogJ0tvbGdhJ30pLnRoZW4oLi4uKTtcbiAqXG4gKiBAdHlwZSB7VnVlLnJlc291cmNlfVxuICovXG5iaWlnbGUuJGRlY2xhcmUoJ2FwaS5sYWJlbFNvdXJjZScsIFZ1ZS5yZXNvdXJjZSgnL2FwaS92MS9sYWJlbC1zb3VyY2Vzey9pZH0vZmluZCcpKTtcbiIsIi8qKlxuICogUmVzb3VyY2UgZm9yIGxhYmVscy5cbiAqXG4gKiB2YXIgcmVzb3VyY2UgPSBiaWlnbGUuJHJlcXVpcmUoJ2FwaS5sYWJlbHMnKTtcbiAqXG4gKiBDcmVhdGUgYSBsYWJlbDpcbiAqXG4gKiByZXNvdXJjZS5zYXZlKHtsYWJlbF90cmVlX2lkOiAxfSwge1xuICogICAgIG5hbWU6IFwiVHJhc2hcIixcbiAqICAgICBjb2xvcjogJ2JhZGE1NSdcbiAqIH0pLnRoZW4oLi4uKTtcbiAqXG4gKiBEZWxldGUgYSBsYWJlbDpcbiAqXG4gKiByZXNvdXJjZS5kZWxldGUoe2lkOiBsYWJlbElkfSkudGhlbiguLi4pO1xuICpcbiAqIEB0eXBlIHtWdWUucmVzb3VyY2V9XG4gKi9cbmJpaWdsZS4kZGVjbGFyZSgnYXBpLmxhYmVscycsIFZ1ZS5yZXNvdXJjZSgnL2FwaS92MS9sYWJlbHN7L2lkfScsIHt9LCB7XG4gICAgc2F2ZToge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgdXJsOiAnL2FwaS92MS9sYWJlbC10cmVlc3svbGFiZWxfdHJlZV9pZH0vbGFiZWxzJyxcbiAgICB9XG59KSk7XG4iLCIvKipcbiAqIEEgY29tcG9uZW50IHRoYXQgZGlzcGxheXMgYSBsYWJlbCB0cmVlLiBUaGUgbGFiZWxzIGNhbiBiZSBzZWFyY2hlZCBhbmQgc2VsZWN0ZWQuXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuYmlpZ2xlLiRjb21wb25lbnQoJ2xhYmVsVHJlZXMuY29tcG9uZW50cy5sYWJlbFRyZWUnLCB7XG4gICAgdGVtcGxhdGU6ICc8ZGl2IGNsYXNzPVwibGFiZWwtdHJlZVwiPicgK1xuICAgICAgICAnPGg0IGNsYXNzPVwibGFiZWwtdHJlZV9fdGl0bGVcIiB2LWlmPVwic2hvd1RpdGxlXCI+JyArXG4gICAgICAgICAgICAnPGJ1dHRvbiB2LWlmPVwiY29sbGFwc2libGVcIiBAY2xpY2suc3RvcD1cImNvbGxhcHNlXCIgY2xhc3M9XCJidG4gYnRuLWRlZmF1bHQgYnRuLXhzIHB1bGwtcmlnaHRcIiA6dGl0bGU9XCJjb2xsYXBzZVRpdGxlXCI+JyArXG4gICAgICAgICAgICAgICAgJzxzcGFuIHYtaWY9XCJjb2xsYXBzZWRcIiBjbGFzcz1cImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1kb3duXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9zcGFuPicgK1xuICAgICAgICAgICAgICAgICc8c3BhbiB2LWVsc2UgY2xhc3M9XCJnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tdXBcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+JyArXG4gICAgICAgICAgICAnPC9idXR0b24+JyArXG4gICAgICAgICAgICAne3tuYW1lfX0nICtcbiAgICAgICAgJzwvaDQ+JyArXG4gICAgICAgICc8dWwgdi1pZj1cIiFjb2xsYXBzZWRcIiBjbGFzcz1cImxhYmVsLXRyZWVfX2xpc3RcIj4nICtcbiAgICAgICAgICAgICc8bGFiZWwtdHJlZS1sYWJlbCA6bGFiZWw9XCJsYWJlbFwiIDpkZWxldGFibGU9XCJkZWxldGFibGVcIiB2LWZvcj1cImxhYmVsIGluIHJvb3RMYWJlbHNcIiBAc2VsZWN0PVwiZW1pdFNlbGVjdFwiIEBkZXNlbGVjdD1cImVtaXREZXNlbGVjdFwiIEBkZWxldGU9XCJlbWl0RGVsZXRlXCI+PC9sYWJlbC10cmVlLWxhYmVsPicgK1xuICAgICAgICAnPC91bD4nICtcbiAgICAnPC9kaXY+JyxcbiAgICBkYXRhOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb2xsYXBzZWQ6IGZhbHNlXG4gICAgICAgIH07XG4gICAgfSxcbiAgICBjb21wb25lbnRzOiB7XG4gICAgICAgIGxhYmVsVHJlZUxhYmVsOiBiaWlnbGUuJHJlcXVpcmUoJ2xhYmVsVHJlZXMuY29tcG9uZW50cy5sYWJlbFRyZWVMYWJlbCcpLFxuICAgIH0sXG4gICAgcHJvcHM6IHtcbiAgICAgICAgbmFtZToge1xuICAgICAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIGxhYmVsczoge1xuICAgICAgICAgICAgdHlwZTogQXJyYXksXG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgc2hvd1RpdGxlOiB7XG4gICAgICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgc3RhbmRhbG9uZToge1xuICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICBjb2xsYXBzaWJsZToge1xuICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIG11bHRpc2VsZWN0OiB7XG4gICAgICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIGRlbGV0YWJsZToge1xuICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICB9XG4gICAgfSxcbiAgICBjb21wdXRlZDoge1xuICAgICAgICBsYWJlbE1hcDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG1hcCA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMubGFiZWxzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgbWFwW3RoaXMubGFiZWxzW2ldLmlkXSA9IHRoaXMubGFiZWxzW2ldO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbWFwO1xuICAgICAgICB9LFxuICAgICAgICBjb21waWxlZExhYmVsczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNvbXBpbGVkID0ge307XG4gICAgICAgICAgICB2YXIgcGFyZW50O1xuICAgICAgICAgICAgLy8gQ3JlYXRlIGRhdGFzdHJ1Y3R1cmUgdGhhdCBtYXBzIGxhYmVsIElEcyB0byB0aGUgY2hpbGQgbGFiZWxzLlxuICAgICAgICAgICAgLy8gR28gZnJvbSAwIHRvIGxlbmd0aCBzbyB0aGUgbGFiZWxzIGFyZSBrZXB0IGluIG9yZGVyLlxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IHRoaXMubGFiZWxzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50ID0gdGhpcy5sYWJlbHNbaV0ucGFyZW50X2lkO1xuICAgICAgICAgICAgICAgIGlmIChjb21waWxlZC5oYXNPd25Qcm9wZXJ0eShwYXJlbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBpbGVkW3BhcmVudF0ucHVzaCh0aGlzLmxhYmVsc1tpXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGlsZWRbcGFyZW50XSA9IFt0aGlzLmxhYmVsc1tpXV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB1cGRhdGUgdGhlIGxhYmVsIGNoaWxkcmVuIHdpdGggdGhlIGNvbXBpbGVkIGRhdGFzdHJ1Y3R1cmVcbiAgICAgICAgICAgIGZvciAoaSA9IHRoaXMubGFiZWxzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBpbGVkLmhhc093blByb3BlcnR5KHRoaXMubGFiZWxzW2ldLmlkKSkge1xuICAgICAgICAgICAgICAgICAgICBWdWUuc2V0KHRoaXMubGFiZWxzW2ldLCAnY2hpbGRyZW4nLCBjb21waWxlZFt0aGlzLmxhYmVsc1tpXS5pZF0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIFZ1ZS5zZXQodGhpcy5sYWJlbHNbaV0sICdjaGlsZHJlbicsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBsYXN0IGNoaWxkIHdhcyBkZWxldGVkLCBjbG9zZSB0aGUgbGFiZWwuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGFiZWxzW2ldLm9wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjb21waWxlZDtcbiAgICAgICAgfSxcbiAgICAgICAgcm9vdExhYmVsczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29tcGlsZWRMYWJlbHNbbnVsbF07XG4gICAgICAgIH0sXG4gICAgICAgIGNvbGxhcHNlVGl0bGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbGxhcHNlZCA/ICdFeHBhbmQnIDogJ0NvbGxhcHNlJztcbiAgICAgICAgfVxuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICBoYXNMYWJlbDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYWJlbE1hcC5oYXNPd25Qcm9wZXJ0eShpZCk7XG4gICAgICAgIH0sXG4gICAgICAgIGdldExhYmVsOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxhYmVsTWFwW2lkXTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0UGFyZW50czogZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICB2YXIgcGFyZW50cyA9IFtdO1xuICAgICAgICAgICAgd2hpbGUgKGxhYmVsLnBhcmVudF9pZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGxhYmVsID0gdGhpcy5nZXRMYWJlbChsYWJlbC5wYXJlbnRfaWQpO1xuICAgICAgICAgICAgICAgIHBhcmVudHMudW5zaGlmdChsYWJlbC5pZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBwYXJlbnRzO1xuICAgICAgICB9LFxuICAgICAgICBlbWl0U2VsZWN0OiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMuJGVtaXQoJ3NlbGVjdCcsIGxhYmVsKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW1pdERlc2VsZWN0OiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMuJGVtaXQoJ2Rlc2VsZWN0JywgbGFiZWwpO1xuICAgICAgICB9LFxuICAgICAgICBlbWl0RGVsZXRlOiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMuJGVtaXQoJ2RlbGV0ZScsIGxhYmVsKTtcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0TGFiZWw6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLm11bHRpc2VsZWN0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhclNlbGVjdGVkTGFiZWxzKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRoZSBzZWxlY3RlZCBsYWJlbCBkb2VzIG5vdCBuZXNzZWNhcmlseSBiZWxvbmcgdG8gdGhpcyBsYWJlbCB0cmVlIHNpbmNlXG4gICAgICAgICAgICAvLyB0aGUgdHJlZSBtYXkgYmUgZGlzcGxheWVkIGluIGEgbGFiZWwtdHJlZXMgY29tcG9uZW50IHdpdGggb3RoZXIgdHJlZXMuXG4gICAgICAgICAgICBpZiAodGhpcy5oYXNMYWJlbChsYWJlbC5pZCkpIHtcbiAgICAgICAgICAgICAgICBsYWJlbC5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5jb2xsYXBzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50cyA9IHRoaXMuZ2V0UGFyZW50cyhsYWJlbCk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IHBhcmVudHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRMYWJlbChwYXJlbnRzW2ldKS5vcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGRlc2VsZWN0TGFiZWw6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaGFzTGFiZWwobGFiZWwuaWQpKSB7XG4gICAgICAgICAgICAgICAgbGFiZWwuc2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY2xlYXJTZWxlY3RlZExhYmVsczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMubGFiZWxzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYWJlbHNbaV0uc2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY29sbGFwc2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuY29sbGFwc2VkID0gIXRoaXMuY29sbGFwc2VkO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBjcmVhdGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIFNldCB0aGUgbGFiZWwgcHJvcGVydGllc1xuICAgICAgICBmb3IgKGkgPSB0aGlzLmxhYmVscy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgVnVlLnNldCh0aGlzLmxhYmVsc1tpXSwgJ29wZW4nLCBmYWxzZSk7XG4gICAgICAgICAgICBWdWUuc2V0KHRoaXMubGFiZWxzW2ldLCAnc2VsZWN0ZWQnLCBmYWxzZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgbGFiZWwgdHJlZSBjYW4gYmUgdXNlZCBpbiBhIGxhYmVsLXRyZWVzIGNvbXBvbmVudCBvciBhcyBhIHNpbmdsZSBsYWJlbFxuICAgICAgICAvLyB0cmVlLiBJbiBhIGxhYmVsLXRyZWVzIGNvbXBvbmVudCBvbmx5IG9uZSBsYWJlbCBjYW4gYmUgc2VsZWN0ZWQgaW4gYWxsIGxhYmVsXG4gICAgICAgIC8vIHRyZWVzIHNvIHRoZSBwYXJlbnQgaGFuZGxlcyB0aGUgZXZlbnQuIEEgc2luZ2xlIGxhYmVsIHRyZWUgaGFuZGxlcyB0aGUgZXZlbnRcbiAgICAgICAgLy8gYnkgaXRzZWxmLlxuICAgICAgICBpZiAodGhpcy5zdGFuZGFsb25lKSB7XG4gICAgICAgICAgICB0aGlzLiRvbignc2VsZWN0JywgdGhpcy5zZWxlY3RMYWJlbCk7XG4gICAgICAgICAgICB0aGlzLiRvbignZGVzZWxlY3QnLCB0aGlzLmRlc2VsZWN0TGFiZWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kcGFyZW50LiRvbignc2VsZWN0JywgdGhpcy5zZWxlY3RMYWJlbCk7XG4gICAgICAgICAgICB0aGlzLiRwYXJlbnQuJG9uKCdkZXNlbGVjdCcsIHRoaXMuZGVzZWxlY3RMYWJlbCk7XG4gICAgICAgICAgICB0aGlzLiRwYXJlbnQuJG9uKCdjbGVhcicsIHRoaXMuY2xlYXJTZWxlY3RlZExhYmVscyk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcbiIsIi8qKlxuICogQSBjb21wb25lbnQgdGhhdCBkaXNwbGF5cyBhIHNpbmdsZSBsYWJlbCBvZiBhIGxhYmVsIHRyZWUuXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuYmlpZ2xlLiRjb21wb25lbnQoJ2xhYmVsVHJlZXMuY29tcG9uZW50cy5sYWJlbFRyZWVMYWJlbCcsIHtcbiAgICBuYW1lOiAnbGFiZWwtdHJlZS1sYWJlbCcsXG4gICAgdGVtcGxhdGU6ICc8bGkgY2xhc3M9XCJsYWJlbC10cmVlLWxhYmVsIGNmXCIgOmNsYXNzPVwiY2xhc3NPYmplY3RcIj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJsYWJlbC10cmVlLWxhYmVsX19uYW1lXCIgQGNsaWNrPVwidG9nZ2xlT3BlblwiPicgK1xuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwibGFiZWwtdHJlZS1sYWJlbF9fY29sb3JcIiA6c3R5bGU9XCJjb2xvclN0eWxlXCI+PC9zcGFuPicgK1xuICAgICAgICAgICAgJzxzcGFuIHYtdGV4dD1cImxhYmVsLm5hbWVcIiBAY2xpY2suc3RvcD1cInRvZ2dsZVNlbGVjdFwiPjwvc3Bhbj4nICtcbiAgICAgICAgICAgICc8c3BhbiB2LWlmPVwic2hvd0Zhdm91cml0ZVwiIGNsYXNzPVwibGFiZWwtdHJlZS1sYWJlbF9fZmF2b3VyaXRlXCIgQGNsaWNrLnN0b3A9XCJ0b2dnbGVGYXZvdXJpdGVcIj4nICtcbiAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJnbHlwaGljb25cIiA6Y2xhc3M9XCJmYXZvdXJpdGVDbGFzc1wiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIHRpdGxlPVwiXCI+PC9zcGFuPicgK1xuICAgICAgICAgICAgJzwvc3Bhbj4nICtcbiAgICAgICAgICAgICc8YnV0dG9uIHYtaWY9XCJkZWxldGFibGVcIiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJjbG9zZSBsYWJlbC10cmVlLWxhYmVsX19kZWxldGVcIiA6dGl0bGU9XCJkZWxldGVUaXRsZVwiIEBjbGljay5zdG9wPVwiZGVsZXRlVGhpc1wiPjxzcGFuIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPiZ0aW1lczs8L3NwYW4+PC9idXR0b24+JyArXG4gICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgJzx1bCB2LWlmPVwibGFiZWwub3BlblwiIGNsYXNzPVwibGFiZWwtdHJlZV9fbGlzdFwiPicgK1xuICAgICAgICAgICAgJzxsYWJlbC10cmVlLWxhYmVsIDpsYWJlbD1cImNoaWxkXCIgOmRlbGV0YWJsZT1cImRlbGV0YWJsZVwiIHYtZm9yPVwiY2hpbGQgaW4gbGFiZWwuY2hpbGRyZW5cIiBAc2VsZWN0PVwiZW1pdFNlbGVjdFwiIEBkZXNlbGVjdD1cImVtaXREZXNlbGVjdFwiIEBkZWxldGU9XCJlbWl0RGVsZXRlXCI+PC9sYWJlbC10cmVlLWxhYmVsPicgK1xuICAgICAgICAnPC91bD4nICtcbiAgICAnPC9saT4nLFxuICAgIGRhdGE6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZhdm91cml0ZTogZmFsc2VcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIHByb3BzOiB7XG4gICAgICAgIGxhYmVsOiB7XG4gICAgICAgICAgICB0eXBlOiBPYmplY3QsXG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgc2hvd0Zhdm91cml0ZToge1xuICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgZGVsZXRhYmxlOiB7XG4gICAgICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgIH1cbiAgICB9LFxuICAgIGNvbXB1dGVkOiB7XG4gICAgICAgIGNsYXNzT2JqZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICdsYWJlbC10cmVlLWxhYmVsLS1zZWxlY3RlZCc6IHRoaXMubGFiZWwuc2VsZWN0ZWQsXG4gICAgICAgICAgICAgICAgJ2xhYmVsLXRyZWUtbGFiZWwtLWV4cGFuZGFibGUnOiB0aGlzLmxhYmVsLmNoaWxkcmVuLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgY29sb3JTdHlsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1jb2xvcic6ICcjJyArIHRoaXMubGFiZWwuY29sb3JcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIGZhdm91cml0ZUNsYXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICdnbHlwaGljb24tc3Rhci1lbXB0eSc6ICF0aGlzLmZhdm91cml0ZSxcbiAgICAgICAgICAgICAgICAnZ2x5cGhpY29uLXN0YXInOiB0aGlzLmZhdm91cml0ZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIGRlbGV0ZVRpdGxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1JlbW92ZSBsYWJlbCAnICsgdGhpcy5sYWJlbC5uYW1lO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIHRvZ2dsZVNlbGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmxhYmVsLnNlbGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kZW1pdCgnc2VsZWN0JywgdGhpcy5sYWJlbCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuJGVtaXQoJ2Rlc2VsZWN0JywgdGhpcy5sYWJlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIGEgbWV0aG9kIGNhbGxlZCAnZGVsZXRlJyBkaWRuJ3Qgd29ya1xuICAgICAgICBkZWxldGVUaGlzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXREZWxldGUodGhpcy5sYWJlbCk7XG4gICAgICAgIH0sXG4gICAgICAgIHRvZ2dsZU9wZW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSBsYWJlbCBjYW5ub3QgYmUgb3BlbmVkLCBpdCB3aWxsIGJlIHNlbGVjdGVkIGhlcmUgaW5zdGVhZC5cbiAgICAgICAgICAgIGlmICghdGhpcy5sYWJlbC5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlU2VsZWN0KCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubGFiZWwub3BlbiA9ICF0aGlzLmxhYmVsLm9wZW47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRvZ2dsZUZhdm91cml0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5mYXZvdXJpdGUgPSAhdGhpcy5mYXZvdXJpdGU7XG4gICAgICAgIH0sXG4gICAgICAgIGVtaXRTZWxlY3Q6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgLy8gYnViYmxlIHRoZSBldmVudCB1cHdhcmRzXG4gICAgICAgICAgICB0aGlzLiRlbWl0KCdzZWxlY3QnLCBsYWJlbCk7XG4gICAgICAgIH0sXG4gICAgICAgIGVtaXREZXNlbGVjdDogZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICAvLyBidWJibGUgdGhlIGV2ZW50IHVwd2FyZHNcbiAgICAgICAgICAgIHRoaXMuJGVtaXQoJ2Rlc2VsZWN0JywgbGFiZWwpO1xuICAgICAgICB9LFxuICAgICAgICBlbWl0RGVsZXRlOiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIC8vIGJ1YmJsZSB0aGUgZXZlbnQgdXB3YXJkc1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgnZGVsZXRlJywgbGFiZWwpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG4iLCIvKipcbiAqIEEgY29tcG9uZW50IHRoYXQgZGlzcGxheXMgYSB0eXBlYWhlYWQgdG8gZmluZCBsYWJlbHMuXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuYmlpZ2xlLiRjb21wb25lbnQoJ2xhYmVsVHJlZXMuY29tcG9uZW50cy5sYWJlbFR5cGVhaGVhZCcsIHtcbiAgICB0ZW1wbGF0ZTogJzx0eXBlYWhlYWQgY2xhc3M9XCJsYWJlbC10eXBlYWhlYWQgY2xlYXJmaXhcIiA6ZGF0YT1cImxhYmVsc1wiIDpwbGFjZWhvbGRlcj1cInBsYWNlaG9sZGVyXCIgOm9uLWhpdD1cInNlbGVjdExhYmVsXCIgOnRlbXBsYXRlPVwidGVtcGxhdGVcIiA6ZGlzYWJsZWQ9XCJkaXNhYmxlZFwiIDp2YWx1ZT1cInZhbHVlXCIgbWF0Y2gtcHJvcGVydHk9XCJuYW1lXCI+PC90eXBlYWhlYWQ+JyxcbiAgICBkYXRhOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZTogJ3t7aXRlbS5uYW1lfX0nLFxuICAgICAgICB9O1xuICAgIH0sXG4gICAgY29tcG9uZW50czoge1xuICAgICAgICB0eXBlYWhlYWQ6IFZ1ZVN0cmFwLnR5cGVhaGVhZCxcbiAgICB9LFxuICAgIHByb3BzOiB7XG4gICAgICAgIGxhYmVsczoge1xuICAgICAgICAgICAgdHlwZTogQXJyYXksXG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgcGxhY2Vob2xkZXI6IHtcbiAgICAgICAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgICAgICAgIGRlZmF1bHQ6ICdMYWJlbCBuYW1lJyxcbiAgICAgICAgfSxcbiAgICAgICAgZGlzYWJsZWQ6IHtcbiAgICAgICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgICAgICAgIGRlZmF1bHQ6ICcnLFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICBzZWxlY3RMYWJlbDogZnVuY3Rpb24gKGxhYmVsLCB0eXBlYWhlYWQpIHtcbiAgICAgICAgICAgIHRoaXMuJGVtaXQoJ3NlbGVjdCcsIGxhYmVsKTtcbiAgICAgICAgICAgIHR5cGVhaGVhZC5yZXNldCgpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG4iLCIvKipcbiAqIEEgY29tcG9uZW50IGZvciBhIGZvcm0gdG8gbWFudWFsbHkgY3JlYXRlIGEgbmV3IGxhYmVsIGZvciBhIGxhYmVsIHRyZWVcbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5iaWlnbGUuJGNvbXBvbmVudCgnbGFiZWxUcmVlcy5jb21wb25lbnRzLm1hbnVhbExhYmVsRm9ybScsIHtcbiAgICBtaXhpbnM6IFtiaWlnbGUuJHJlcXVpcmUoJ2xhYmVsVHJlZXMubWl4aW5zLmxhYmVsRm9ybUNvbXBvbmVudCcpXSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIHN1Ym1pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGxhYmVsID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMuc2VsZWN0ZWROYW1lLFxuICAgICAgICAgICAgICAgIGNvbG9yOiB0aGlzLnNlbGVjdGVkQ29sb3IsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAodGhpcy5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBsYWJlbC5wYXJlbnRfaWQgPSB0aGlzLnBhcmVudC5pZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy4kZW1pdCgnc3VibWl0JywgbGFiZWwpO1xuICAgICAgICB9XG4gICAgfSxcbn0pO1xuIiwiLyoqXG4gKiBBIGNvbXBvbmVudCBmb3IgYSBmb3JtIHRvIG1hbnVhbGx5IGNyZWF0ZSBhIG5ldyBsYWJlbCBmb3IgYSBsYWJlbCB0cmVlXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuYmlpZ2xlLiRjb21wb25lbnQoJ2xhYmVsVHJlZXMuY29tcG9uZW50cy53b3Jtc0xhYmVsRm9ybScsIHtcbiAgICBtaXhpbnM6IFtiaWlnbGUuJHJlcXVpcmUoJ2xhYmVsVHJlZXMubWl4aW5zLmxhYmVsRm9ybUNvbXBvbmVudCcpXSxcbiAgICBjb21wb25lbnRzOiB7XG4gICAgICAgIHdvcm1zUmVzdWx0SXRlbTogYmlpZ2xlLiRyZXF1aXJlKCdsYWJlbFRyZWVzLmNvbXBvbmVudHMud29ybXNSZXN1bHRJdGVtJyksXG4gICAgfSxcbiAgICBkYXRhOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN1bHRzOiBbXSxcbiAgICAgICAgICAgIHJlY3Vyc2l2ZTogZmFsc2UsXG4gICAgICAgICAgICBoYXNTZWFyY2hlZDogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfSxcbiAgICBjb21wdXRlZDoge1xuICAgICAgICBoYXNSZXN1bHRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXN1bHRzLmxlbmd0aCA+IDA7XG4gICAgICAgIH0sXG4gICAgICAgIHJlY3Vyc2l2ZUJ1dHRvbkNsYXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGFjdGl2ZTogdGhpcy5yZWN1cnNpdmUsXG4gICAgICAgICAgICAgICAgJ2J0bi1wcmltYXJ5JzogdGhpcy5yZWN1cnNpdmUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIHN1Ym1pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gdGhpcy4kZW1pdCgnc3VibWl0Jyk7XG4gICAgICAgIH0sXG4gICAgICAgIGZpbmROYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgd29ybXMgPSBiaWlnbGUuJHJlcXVpcmUoJ2xhYmVsVHJlZXMud29ybXNMYWJlbFNvdXJjZScpO1xuICAgICAgICAgICAgdmFyIGxhYmVsU291cmNlID0gYmlpZ2xlLiRyZXF1aXJlKCdhcGkubGFiZWxTb3VyY2UnKTtcbiAgICAgICAgICAgIHZhciBtZXNzYWdlcyA9IGJpaWdsZS4kcmVxdWlyZSgnbWVzc2FnZXMuc3RvcmUnKTtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHRoaXMuJGVtaXQoJ2xvYWQtc3RhcnQnKTtcblxuICAgICAgICAgICAgbGFiZWxTb3VyY2UucXVlcnkoe2lkOiB3b3Jtcy5pZCwgcXVlcnk6IHRoaXMuc2VsZWN0ZWROYW1lfSlcbiAgICAgICAgICAgICAgICAudGhlbih0aGlzLnVwZGF0ZVJlc3VsdHMsIG1lc3NhZ2VzLmhhbmRsZUVycm9yUmVzcG9uc2UpXG4gICAgICAgICAgICAgICAgLmZpbmFsbHkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmhhc1NlYXJjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kZW1pdCgnbG9hZC1maW5pc2gnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdXBkYXRlUmVzdWx0czogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB0aGlzLnJlc3VsdHMgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICB9LFxuICAgICAgICBpbXBvcnRJdGVtOiBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgdmFyIHdvcm1zID0gYmlpZ2xlLiRyZXF1aXJlKCdsYWJlbFRyZWVzLndvcm1zTGFiZWxTb3VyY2UnKTtcblxuICAgICAgICAgICAgdmFyIGxhYmVsID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6IGl0ZW0ubmFtZSxcbiAgICAgICAgICAgICAgICBjb2xvcjogdGhpcy5zZWxlY3RlZENvbG9yLFxuICAgICAgICAgICAgICAgIHNvdXJjZV9pZDogaXRlbS5hcGhpYV9pZCxcbiAgICAgICAgICAgICAgICBsYWJlbF9zb3VyY2VfaWQ6IHdvcm1zLmlkLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKHRoaXMucmVjdXJzaXZlKSB7XG4gICAgICAgICAgICAgICAgbGFiZWwucmVjdXJzaXZlID0gJ3RydWUnO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnBhcmVudCkge1xuICAgICAgICAgICAgICAgIGxhYmVsLnBhcmVudF9pZCA9IHRoaXMucGFyZW50LmlkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLiRlbWl0KCdzdWJtaXQnLCBsYWJlbCk7XG4gICAgICAgIH0sXG4gICAgICAgIHRvZ2dsZVJlY3Vyc2l2ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5yZWN1cnNpdmUgPSAhdGhpcy5yZWN1cnNpdmU7XG4gICAgICAgIH1cbiAgICB9LFxufSk7XG4iLCIvKipcbiAqIEFuIGl0ZW0gb2YgdGhlIHJlc3VsdHMgbGlzdCBvZiBhIFdvUk1TIHNlYXJjaFxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbmJpaWdsZS4kY29tcG9uZW50KCdsYWJlbFRyZWVzLmNvbXBvbmVudHMud29ybXNSZXN1bHRJdGVtJywge1xuICAgIHByb3BzOiB7XG4gICAgICAgIGl0ZW06IHtcbiAgICAgICAgICAgIHR5cGU6IE9iamVjdCxcbiAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICByZWN1cnNpdmU6IHtcbiAgICAgICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgbGFiZWxzOiB7XG4gICAgICAgICAgICB0eXBlOiBBcnJheSxcbiAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBwYXJlbnQ6IHtcbiAgICAgICAgICAgIHR5cGU6IE9iamVjdCxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGwsXG4gICAgICAgIH1cbiAgICB9LFxuICAgIGNvbXB1dGVkOiB7XG4gICAgICAgIGNsYXNzaWZpY2F0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pdGVtLnBhcmVudHMuam9pbignID4gJyk7XG4gICAgICAgIH0sXG4gICAgICAgIGJ1dHRvblRpdGxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5yZWN1cnNpdmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ0FkZCAnICsgdGhpcy5pdGVtLm5hbWUgKyAnIGFuZCBhbGwgV29STVMgcGFyZW50cyBhcyBuZXcgbGFiZWxzJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdBZGQgJyArIHRoaXMuaXRlbS5uYW1lICsgJyBhcyBhIGNoaWxkIG9mICcgKyB0aGlzLnBhcmVudC5uYW1lO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gJ0FkZCAnICsgdGhpcy5pdGVtLm5hbWUgKyAnIGFzIGEgcm9vdCBsYWJlbCc7XG4gICAgICAgIH0sXG4gICAgICAgIGNsYXNzT2JqZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICdsaXN0LWdyb3VwLWl0ZW0tc3VjY2Vzcyc6IHRoaXMuc2VsZWN0ZWRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHNlbGVjdGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICByZXR1cm4gISF0aGlzLmxhYmVscy5maW5kKGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsYWJlbC5zb3VyY2VfaWQgPT0gc2VsZi5pdGVtLmFwaGlhX2lkO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgc2VsZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiRlbWl0KCdzZWxlY3QnLCB0aGlzLml0ZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0sXG59KTtcbiIsIi8qKlxuICogQSBtaXhpbiBmb3IgY29tcG9uZW50cyB0aGF0IGNyZWF0ZSBuZXcgbGFiZWxzXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuYmlpZ2xlLiRjb21wb25lbnQoJ2xhYmVsVHJlZXMubWl4aW5zLmxhYmVsRm9ybUNvbXBvbmVudCcsIHtcbiAgICBwcm9wczoge1xuICAgICAgICBsYWJlbHM6IHtcbiAgICAgICAgICAgIHR5cGU6IEFycmF5LFxuICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIGNvbG9yOiB7XG4gICAgICAgICAgICB0eXBlOiBTdHJpbmcsXG4gICAgICAgICAgICBkZWZhdWx0OiAnJyxcbiAgICAgICAgfSxcbiAgICAgICAgcGFyZW50OiB7XG4gICAgICAgICAgICB0eXBlOiBPYmplY3QsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsLFxuICAgICAgICB9LFxuICAgICAgICBuYW1lOiB7XG4gICAgICAgICAgICB0eXBlOiBTdHJpbmcsXG4gICAgICAgICAgICBkZWZhdWx0OiAnJyxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgbGFiZWxUeXBlYWhlYWQ6IGJpaWdsZS4kcmVxdWlyZSgnbGFiZWxUcmVlcy5jb21wb25lbnRzLmxhYmVsVHlwZWFoZWFkJyksXG4gICAgfSxcbiAgICBjb21wdXRlZDoge1xuICAgICAgICBzZWxlY3RlZENvbG9yOiB7XG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jb2xvcjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uIChjb2xvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuJGVtaXQoJ2NvbG9yJywgY29sb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBzZWxlY3RlZE5hbWU6IHtcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm5hbWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuJGVtaXQoJ25hbWUnLCBuYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0ZWRQYXJlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcmVudCA/IHRoaXMucGFyZW50Lm5hbWUgOiAnJztcbiAgICAgICAgfSxcbiAgICAgICAgaGFzTm9MYWJlbHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxhYmVscy5sZW5ndGggPT09IDA7XG4gICAgICAgIH0sXG4gICAgICAgIGhhc05vUGFyZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gIXRoaXMucGFyZW50O1xuICAgICAgICB9LFxuICAgICAgICBoYXNOb05hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhdGhpcy5uYW1lO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIHJlZnJlc2hDb2xvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZENvbG9yID0gYmlpZ2xlLiRyZXF1aXJlKCdsYWJlbFRyZWVzLnJhbmRvbUNvbG9yJykoKTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVzZXRQYXJlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuJGVtaXQoJ3BhcmVudCcsIG51bGwpO1xuICAgICAgICB9LFxuICAgICAgICBzZWxlY3RMYWJlbDogZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLiRlbWl0KCdwYXJlbnQnLCBsYWJlbCk7XG4gICAgICAgIH0sXG4gICAgfSxcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
