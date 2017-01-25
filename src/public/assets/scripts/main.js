/**
 * The panel for editing the labels of a label tree
 */
biigle.$viewModel('label-trees-labels', function (element) {
    var labels = biigle.$require('api.labels');
    var messages = biigle.$require('messages.store');

    new Vue({
        el: element,
        data: {
            editing: false,
            loading: false,
            labels: biigle.$require('labelTrees.labels'),
        },
        components: {
            typeahead: VueStrap.typeahead,
            tabs: VueStrap.tabs,
            tab: VueStrap.tab,
            labelTree: biigle.$require('labelTrees.components.labelTree'),
        },
        computed: {
            classObject: function () {
                return {
                    'panel-warning': this.editing
                };
            },
            authorizableProjects: function () {
                return [];
            }
        },
        methods: {
            toggleEditing: function () {
                this.editing = !this.editing;
            },
            finishLoading: function () {
                this.loading = false;
            },
            deleteLabel: function (label) {
                var self = this;
                this.loading = true;
                labels.delete({id: label.id})
                    .then(function () {
                        self.labelDeleted(label);
                    }, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
            labelDeleted: function (label) {
                for (var i = this.labels.length - 1; i >= 0; i--) {
                    if (this.labels[i].id === label.id) {
                        this.labels.splice(i, 1);
                        break;
                    }
                }
            },
        }
    });
});

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
 * @name LabelsController
 * @memberOf biigle.label-trees
 * @description Controller for the interactive label tree
 */
angular.module('biigle.label-trees').controller('LabelsController', ["$scope", "LABELS", "LABEL_TREE", "Label", "msg", "$q", function ($scope, LABELS, LABEL_TREE, Label, msg, $q) {
        "use strict";

        var editing = false;

        var loading = false;

        var selectedLabel = null;

        $scope.tree = {};

        // IDs of all labels that are currently open
        // (all parent labels of the selected label)
        $scope.openHierarchy = [];

        var handleError = function (response) {
            msg.responseError(response);
            loading = false;
        };

        var buildTree = function () {
            $scope.tree = {};
            LABELS.forEach(function (label) {
                var parent = label.parent_id;
                if ($scope.tree[parent]) {
                    $scope.tree[parent].push(label);
                } else {
                    $scope.tree[parent] = [label];
                }
            });
        };

        var handleCreateLabelSuccess = function (labels) {
            Array.prototype.push.apply(LABELS, labels);
            buildTree();
            $scope.$broadcast('labels.refresh');
            loading = false;
        };

        var labelDeleted = function (label) {
            for (var i = LABELS.length - 1; i >= 0; i--) {
                if (LABELS[i].id === label.id) {
                    LABELS.splice(i, 1);
                    break;
                }
            }
            buildTree();
            $scope.$broadcast('labels.refresh');

            if (selectedLabel && selectedLabel.id === label.id) {
                // select the parent if the currently selected label was deleted
                selectedLabel = getLabel(label.parent_id);
            }

            $scope.selectLabel(selectedLabel);
            loading = false;
        };

        var getLabel = function (id) {
            for (var i = LABELS.length - 1; i >= 0; i--) {
                if (LABELS[i].id === id) {
                    return LABELS[i];
                }
            }

            return null;
        };

        var updateOpenHierarchy = function (label) {
            var currentLabel = label;
            $scope.openHierarchy.length = 0;

            if (!currentLabel) return;

            while (currentLabel.parent_id !== null) {
                $scope.openHierarchy.unshift(currentLabel.parent_id);
                currentLabel = getLabel(currentLabel.parent_id);
            }
        };

        $scope.selectLabel = function (label) {
            selectedLabel = label;
            updateOpenHierarchy(label);
            $scope.$broadcast('labels.selected', label);
        };

        $scope.isSelectedLabel = function (label) {
            return selectedLabel && selectedLabel.id === label.id;
        };

        $scope.hasLabels = function () {
            return LABELS.length > 0;
        };

        $scope.isEditing = function () {
            return editing;
        };

        $scope.toggleEditing = function () {
            editing = !editing;
        };

        $scope.getLabels = function () {
            return LABELS;
        };

        $scope.createLabel = function (label) {
            // prevent users from accidentally adding a label twice
            if (loading) {
                var deferred = $q.defer();
                deferred.resolve([]);
                return deferred.promise;
            }

            loading = true;
            label.label_tree_id = LABEL_TREE.id;
            return Label.create(label, handleCreateLabelSuccess, handleError).$promise;
        };

        $scope.removeLabel = function (label, e) {
            loading = true;
            e.stopPropagation();
            Label.delete({id: label.id}, function () {
                labelDeleted(label);
            }, handleError);
        };

        $scope.isLoading = function () {
            return loading;
        };

        $scope.startLoading = function () {
            loading = true;
        };

        $scope.stopLoading = function () {
            loading = false;
        };

        buildTree();
    }]
);

/**
 * @namespace biigle.label-trees
 * @ngdoc controller
 * @name ManualLabelsController
 * @memberOf biigle.label-trees
 * @description Controller for manually adding labels to the label tree
 */
angular.module('biigle.label-trees').controller('ManualLabelsController', ["$scope", "randomColor", function ($scope, randomColor) {
        "use strict";

        var DEFAULTS = {
            LABEL: null,
            NAME: ''
        };

        $scope.selected = {
            label: DEFAULTS.LABEL,
            color: randomColor.get(),
            name: DEFAULTS.NAME
        };

        var handleLabelCreateSuccess = function () {
            $scope.resetName();

            // don't refresh the color if new labels should get the same color than the
            // selected (parent) label
            if (!$scope.selected.label || ('#' + $scope.selected.label.color) !== $scope.selected.color) {
                $scope.refreshColor();
            }
        };

        $scope.resetParent = function () {
            $scope.selectLabel(DEFAULTS.LABEL);
        };

        $scope.refreshColor = function () {
            $scope.selected.color = randomColor.get();
        };

        $scope.resetName = function () {
            $scope.selected.name = DEFAULTS.NAME;
        };

        $scope.isNameDirty = function () {
            return $scope.selected.name !== DEFAULTS.NAME;
        };

        $scope.isParentDirty = function () {
            return $scope.selected.label !== DEFAULTS.LABEL;
        };

        $scope.addLabel = function () {
            var label = {
                name: $scope.selected.name,
                color: $scope.selected.color
            };

            if ($scope.selected.label) {
                label.parent_id = $scope.selected.label.id;
            }

            $scope.createLabel(label).then(handleLabelCreateSuccess);
        };

        $scope.$on('labels.selected', function (e, label) {
            $scope.selected.label = label;
            if (label) {
                $scope.selected.color = '#' + label.color;
            }
        });
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
 * @ngdoc controller
 * @name WormsLabelsController
 * @memberOf biigle.label-trees
 * @description Controller for importing labels from WoRMS
 */
angular.module('biigle.label-trees').controller('WormsLabelsController', ["$scope", "LabelSource", "LABEL_SOURCES", "msg", "randomColor", function ($scope, LabelSource, LABEL_SOURCES, msg, randomColor) {
        "use strict";

        // WoRMS label source
        var source = (function () {
            for (var i = LABEL_SOURCES.length - 1; i >= 0; i--) {
                if (LABEL_SOURCES[i].name === 'worms') {
                    return LABEL_SOURCES[i];
                }
            }
        })();

        var DEFAULTS = {
            LABEL: null,
            NAME: ''
        };

        var findResults = [];
        // is the search query currently being processed?
        var finding = false;

        // is the recursive option activated?
        var recursive = false;

        // source_id of all labels that were imported in this session
        var importedIds = [];

        var handleFindError = function (response) {
            finding = false;
            $scope.stopLoading();
            msg.responseError(response);
        };

        var handleFindSuccess = function () {
            finding = false;
            $scope.stopLoading();
        };

        var addImportedIds = function (labels) {
            for (var i = labels.length - 1; i >= 0; i--) {
                importedIds.push(parseInt(labels[i].source_id));
            }

            // don't refresh the color if new labels should get the same color than the
            // selected (parent) label
            if (!$scope.selected.label || ('#' + $scope.selected.label.color) !== $scope.selected.color) {
                $scope.refreshColor();
            }
        };

        $scope.selected = {
            label: DEFAULTS.LABEL,
            color: randomColor.get(),
            name: DEFAULTS.NAME
        };

        $scope.getFindResults = function () {
            return findResults;
        };

        $scope.isFinding = function () {
            return finding;
        };

        $scope.hasFindResults = function () {
            return findResults.length > 0;
        };

        $scope.find = function () {
            finding = true;
            $scope.startLoading();
            findResults = LabelSource.query(
                {id: source.id, query: $scope.selected.name},
                handleFindSuccess,
                handleFindError
            );
        };

        $scope.getClassification = function (item) {
            return item.parents.join(' > ');
        };

        $scope.resetParent = function () {
            $scope.selectLabel(DEFAULTS.LABEL);
        };

        $scope.refreshColor = function () {
            $scope.selected.color = randomColor.get();
        };

        $scope.isNameDirty = function () {
            return $scope.selected.name !== DEFAULTS.NAME;
        };

        $scope.isParentDirty = function () {
            return $scope.selected.label !== DEFAULTS.LABEL;
        };

        $scope.toggleRecursive = function () {
            recursive = !recursive;
        };

        $scope.isRecursive = function () {
            return recursive;
        };

        $scope.addLabel = function (item) {
            var label = {
                name: item.name,
                color: $scope.selected.color,
                source_id: item.aphia_id,
                label_source_id: source.id
            };

            if (recursive) {
                label.recursive = 'true';
            } else if ($scope.selected.label) {
                label.parent_id = $scope.selected.label.id;
            }

            $scope.createLabel(label).then(addImportedIds);
        };

        $scope.getAddButtonTitle = function (item) {
            if ($scope.isRecursive()) {
                return 'Add ' + item.name + ' and all WoRMS parents as new labels';
            }

            if ($scope.isParentDirty()) {
                return 'Add ' + item.name + ' as a child of ' + $scope.selected.label.name;
            }

            return 'Add ' + item.name + ' as a root label';
        };

        $scope.hasBeenImported = function (item) {
            return importedIds.indexOf(item.aphia_id) !== -1;
        };

        $scope.$on('labels.selected', function (e, label) {
            $scope.selected.label = label;
            if (label) {
                $scope.selected.color = '#' + label.color;
            }
        });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZ1ZS9sYWJlbFRyZWVzTGFiZWxzLmpzIiwibGFiZWwtdHJlZXMvbWFpbi5qcyIsInZ1ZS9jb21wb25lbnRzL2xhYmVsVHJlZS5qcyIsInZ1ZS9jb21wb25lbnRzL2xhYmVsVHJlZUxhYmVsLmpzIiwidnVlL2FwaS9sYWJlbHMuanMiLCJsYWJlbC10cmVlcy9jb250cm9sbGVycy9BdXRob3JpemVkUHJvamVjdHNDb250cm9sbGVyLmpzIiwibGFiZWwtdHJlZXMvY29udHJvbGxlcnMvTGFiZWxUcmVlQ29udHJvbGxlci5qcyIsImxhYmVsLXRyZWVzL2NvbnRyb2xsZXJzL0xhYmVsc0NvbnRyb2xsZXIuanMiLCJsYWJlbC10cmVlcy9jb250cm9sbGVycy9NYW51YWxMYWJlbHNDb250cm9sbGVyLmpzIiwibGFiZWwtdHJlZXMvY29udHJvbGxlcnMvTWVtYmVyc0NvbnRyb2xsZXIuanMiLCJsYWJlbC10cmVlcy9jb250cm9sbGVycy9Xb3Jtc0xhYmVsc0NvbnRyb2xsZXIuanMiLCJsYWJlbC10cmVlcy9kaXJlY3RpdmVzL2xhYmVsVHJlZUl0ZW0uanMiLCJsYWJlbC10cmVlcy9zZXJ2aWNlcy9yYW5kb21Db2xvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FBR0EsT0FBQSxXQUFBLHNCQUFBLFVBQUEsU0FBQTtJQUNBLElBQUEsU0FBQSxPQUFBLFNBQUE7SUFDQSxJQUFBLFdBQUEsT0FBQSxTQUFBOztJQUVBLElBQUEsSUFBQTtRQUNBLElBQUE7UUFDQSxNQUFBO1lBQ0EsU0FBQTtZQUNBLFNBQUE7WUFDQSxRQUFBLE9BQUEsU0FBQTs7UUFFQSxZQUFBO1lBQ0EsV0FBQSxTQUFBO1lBQ0EsTUFBQSxTQUFBO1lBQ0EsS0FBQSxTQUFBO1lBQ0EsV0FBQSxPQUFBLFNBQUE7O1FBRUEsVUFBQTtZQUNBLGFBQUEsWUFBQTtnQkFDQSxPQUFBO29CQUNBLGlCQUFBLEtBQUE7OztZQUdBLHNCQUFBLFlBQUE7Z0JBQ0EsT0FBQTs7O1FBR0EsU0FBQTtZQUNBLGVBQUEsWUFBQTtnQkFDQSxLQUFBLFVBQUEsQ0FBQSxLQUFBOztZQUVBLGVBQUEsWUFBQTtnQkFDQSxLQUFBLFVBQUE7O1lBRUEsYUFBQSxVQUFBLE9BQUE7Z0JBQ0EsSUFBQSxPQUFBO2dCQUNBLEtBQUEsVUFBQTtnQkFDQSxPQUFBLE9BQUEsQ0FBQSxJQUFBLE1BQUE7cUJBQ0EsS0FBQSxZQUFBO3dCQUNBLEtBQUEsYUFBQTt1QkFDQSxTQUFBO3FCQUNBLFFBQUEsS0FBQTs7WUFFQSxjQUFBLFVBQUEsT0FBQTtnQkFDQSxLQUFBLElBQUEsSUFBQSxLQUFBLE9BQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO29CQUNBLElBQUEsS0FBQSxPQUFBLEdBQUEsT0FBQSxNQUFBLElBQUE7d0JBQ0EsS0FBQSxPQUFBLE9BQUEsR0FBQTt3QkFDQTs7Ozs7Ozs7Ozs7O0FDOUNBLFFBQUEsT0FBQSxzQkFBQSxDQUFBLGNBQUE7Ozs7OztBQU1BLFFBQUEsT0FBQSxzQkFBQSw0QkFBQSxVQUFBLGtCQUFBO0lBQ0E7O0lBRUEsaUJBQUEsaUJBQUE7Ozs7Ozs7O0FDUkEsT0FBQSxXQUFBLG1DQUFBO0lBQ0EsVUFBQTtRQUNBO1lBQ0E7Z0JBQ0E7Z0JBQ0E7WUFDQTtZQUNBO1FBQ0E7UUFDQTtZQUNBO1FBQ0E7SUFDQTtJQUNBLE1BQUEsWUFBQTtRQUNBLE9BQUE7WUFDQSxXQUFBOzs7SUFHQSxZQUFBO1FBQ0EsZ0JBQUEsT0FBQSxTQUFBOztJQUVBLE9BQUE7UUFDQSxNQUFBO1lBQ0EsTUFBQTtZQUNBLFVBQUE7O1FBRUEsUUFBQTtZQUNBLE1BQUE7WUFDQSxVQUFBOztRQUVBLFdBQUE7WUFDQSxNQUFBO1lBQ0EsU0FBQTs7UUFFQSxZQUFBO1lBQ0EsTUFBQTtZQUNBLFNBQUE7O1FBRUEsYUFBQTtZQUNBLE1BQUE7WUFDQSxTQUFBOztRQUVBLGFBQUE7WUFDQSxNQUFBO1lBQ0EsU0FBQTs7UUFFQSxXQUFBO1lBQ0EsTUFBQTtZQUNBLFNBQUE7OztJQUdBLFVBQUE7UUFDQSxVQUFBLFlBQUE7WUFDQSxJQUFBLE1BQUE7WUFDQSxLQUFBLElBQUEsSUFBQSxLQUFBLE9BQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO2dCQUNBLElBQUEsS0FBQSxPQUFBLEdBQUEsTUFBQSxLQUFBLE9BQUE7OztZQUdBLE9BQUE7O1FBRUEsZ0JBQUEsWUFBQTtZQUNBLElBQUEsV0FBQTtZQUNBLElBQUE7OztZQUdBLEtBQUEsSUFBQSxJQUFBLEdBQUEsU0FBQSxLQUFBLE9BQUEsUUFBQSxJQUFBLFFBQUEsS0FBQTtnQkFDQSxTQUFBLEtBQUEsT0FBQSxHQUFBO2dCQUNBLElBQUEsU0FBQSxlQUFBLFNBQUE7b0JBQ0EsU0FBQSxRQUFBLEtBQUEsS0FBQSxPQUFBO3VCQUNBO29CQUNBLFNBQUEsVUFBQSxDQUFBLEtBQUEsT0FBQTs7Ozs7WUFLQSxLQUFBLElBQUEsS0FBQSxPQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtnQkFDQSxJQUFBLFNBQUEsZUFBQSxLQUFBLE9BQUEsR0FBQSxLQUFBO29CQUNBLElBQUEsSUFBQSxLQUFBLE9BQUEsSUFBQSxZQUFBLFNBQUEsS0FBQSxPQUFBLEdBQUE7dUJBQ0E7b0JBQ0EsSUFBQSxJQUFBLEtBQUEsT0FBQSxJQUFBLFlBQUE7Ozs7WUFJQSxPQUFBOztRQUVBLFlBQUEsWUFBQTtZQUNBLE9BQUEsS0FBQSxlQUFBOztRQUVBLGVBQUEsWUFBQTtZQUNBLE9BQUEsS0FBQSxZQUFBLFdBQUE7OztJQUdBLFNBQUE7UUFDQSxVQUFBLFVBQUEsSUFBQTtZQUNBLE9BQUEsS0FBQSxTQUFBLGVBQUE7O1FBRUEsVUFBQSxVQUFBLElBQUE7WUFDQSxPQUFBLEtBQUEsU0FBQTs7UUFFQSxZQUFBLFVBQUEsT0FBQTtZQUNBLElBQUEsVUFBQTtZQUNBLE9BQUEsTUFBQSxjQUFBLE1BQUE7Z0JBQ0EsUUFBQSxLQUFBLFNBQUEsTUFBQTtnQkFDQSxRQUFBLFFBQUEsTUFBQTs7O1lBR0EsT0FBQTs7UUFFQSxZQUFBLFVBQUEsT0FBQTtZQUNBLEtBQUEsTUFBQSxVQUFBOztRQUVBLGNBQUEsVUFBQSxPQUFBO1lBQ0EsS0FBQSxNQUFBLFlBQUE7O1FBRUEsWUFBQSxVQUFBLE9BQUE7WUFDQSxLQUFBLE1BQUEsVUFBQTs7UUFFQSxhQUFBLFVBQUEsT0FBQTtZQUNBLElBQUEsQ0FBQSxLQUFBLGFBQUE7Z0JBQ0EsS0FBQTs7Ozs7WUFLQSxJQUFBLEtBQUEsU0FBQSxNQUFBLEtBQUE7Z0JBQ0EsTUFBQSxXQUFBO2dCQUNBLEtBQUEsWUFBQTtnQkFDQSxJQUFBLFVBQUEsS0FBQSxXQUFBO2dCQUNBLEtBQUEsSUFBQSxJQUFBLFFBQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO29CQUNBLEtBQUEsU0FBQSxRQUFBLElBQUEsT0FBQTs7OztRQUlBLGVBQUEsVUFBQSxPQUFBO1lBQ0EsSUFBQSxLQUFBLFNBQUEsTUFBQSxLQUFBO2dCQUNBLE1BQUEsV0FBQTs7O1FBR0EscUJBQUEsWUFBQTtZQUNBLEtBQUEsSUFBQSxJQUFBLEtBQUEsT0FBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7Z0JBQ0EsS0FBQSxPQUFBLEdBQUEsV0FBQTs7O1FBR0EsVUFBQSxZQUFBO1lBQ0EsS0FBQSxZQUFBLENBQUEsS0FBQTs7O0lBR0EsU0FBQSxZQUFBOztRQUVBLEtBQUEsSUFBQSxLQUFBLE9BQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO1lBQ0EsSUFBQSxJQUFBLEtBQUEsT0FBQSxJQUFBLFFBQUE7WUFDQSxJQUFBLElBQUEsS0FBQSxPQUFBLElBQUEsWUFBQTs7Ozs7OztRQU9BLElBQUEsS0FBQSxZQUFBO1lBQ0EsS0FBQSxJQUFBLFVBQUEsS0FBQTtZQUNBLEtBQUEsSUFBQSxZQUFBLEtBQUE7ZUFDQTtZQUNBLEtBQUEsUUFBQSxJQUFBLFVBQUEsS0FBQTtZQUNBLEtBQUEsUUFBQSxJQUFBLFlBQUEsS0FBQTtZQUNBLEtBQUEsUUFBQSxJQUFBLFNBQUEsS0FBQTs7Ozs7Ozs7OztBQ3BLQSxPQUFBLFdBQUEsd0NBQUE7SUFDQSxNQUFBO0lBQ0EsVUFBQTtRQUNBO1lBQ0E7WUFDQTtZQUNBO2dCQUNBO1lBQ0E7WUFDQTtR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QSxVQUFBLFFBQUEsUUFBQSxZQUFBLE9BQUEsS0FBQSxJQUFBO1FBQ0E7O1FBRUEsSUFBQSxVQUFBOztRQUVBLElBQUEsVUFBQTs7UUFFQSxJQUFBLGdCQUFBOztRQUVBLE9BQUEsT0FBQTs7OztRQUlBLE9BQUEsZ0JBQUE7O1FBRUEsSUFBQSxjQUFBLFVBQUEsVUFBQTtZQUNBLElBQUEsY0FBQTtZQUNBLFVBQUE7OztRQUdBLElBQUEsWUFBQSxZQUFBO1lBQ0EsT0FBQSxPQUFBO1lBQ0EsT0FBQSxRQUFBLFVBQUEsT0FBQTtnQkFDQSxJQUFBLFNBQUEsTUFBQTtnQkFDQSxJQUFBLE9BQUEsS0FBQSxTQUFBO29CQUNBLE9BQUEsS0FBQSxRQUFBLEtBQUE7dUJBQ0E7b0JBQ0EsT0FBQSxLQUFBLFVBQUEsQ0FBQTs7Ozs7UUFLQSxJQUFBLDJCQUFBLFVBQUEsUUFBQTtZQUNBLE1BQUEsVUFBQSxLQUFBLE1BQUEsUUFBQTtZQUNBO1lBQ0EsT0FBQSxXQUFBO1lBQ0EsVUFBQTs7O1FBR0EsSUFBQSxlQUFBLFVBQUEsT0FBQTtZQUNBLEtBQUEsSUFBQSxJQUFBLE9BQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO2dCQUNBLElBQUEsT0FBQSxHQUFBLE9BQUEsTUFBQSxJQUFBO29CQUNBLE9BQUEsT0FBQSxHQUFBO29CQUNBOzs7WUFHQTtZQUNBLE9BQUEsV0FBQTs7WUFFQSxJQUFBLGlCQUFBLGNBQUEsT0FBQSxNQUFBLElBQUE7O2dCQUVBLGdCQUFBLFNBQUEsTUFBQTs7O1lBR0EsT0FBQSxZQUFBO1lBQ0EsVUFBQTs7O1FBR0EsSUFBQSxXQUFBLFVBQUEsSUFBQTtZQUNBLEtBQUEsSUFBQSxJQUFBLE9BQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO2dCQUNBLElBQUEsT0FBQSxHQUFBLE9BQUEsSUFBQTtvQkFDQSxPQUFBLE9BQUE7Ozs7WUFJQSxPQUFBOzs7UUFHQSxJQUFBLHNCQUFBLFVBQUEsT0FBQTtZQUNBLElBQUEsZUFBQTtZQUNBLE9BQUEsY0FBQSxTQUFBOztZQUVBLElBQUEsQ0FBQSxjQUFBOztZQUVBLE9BQUEsYUFBQSxjQUFBLE1BQUE7Z0JBQ0EsT0FBQSxjQUFBLFFBQUEsYUFBQTtnQkFDQSxlQUFBLFNBQUEsYUFBQTs7OztRQUlBLE9BQUEsY0FBQSxVQUFBLE9BQUE7WUFDQSxnQkFBQTtZQUNBLG9CQUFBO1lBQ0EsT0FBQSxXQUFBLG1CQUFBOzs7UUFHQSxPQUFBLGtCQUFBLFVBQUEsT0FBQTtZQUNBLE9BQUEsaUJBQUEsY0FBQSxPQUFBLE1BQUE7OztRQUdBLE9BQUEsWUFBQSxZQUFBO1lBQ0EsT0FBQSxPQUFBLFNBQUE7OztRQUdBLE9BQUEsWUFBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsT0FBQSxnQkFBQSxZQUFBO1lBQ0EsVUFBQSxDQUFBOzs7UUFHQSxPQUFBLFlBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLE9BQUEsY0FBQSxVQUFBLE9BQUE7O1lBRUEsSUFBQSxTQUFBO2dCQUNBLElBQUEsV0FBQSxHQUFBO2dCQUNBLFNBQUEsUUFBQTtnQkFDQSxPQUFBLFNBQUE7OztZQUdBLFVBQUE7WUFDQSxNQUFBLGdCQUFBLFdBQUE7WUFDQSxPQUFBLE1BQUEsT0FBQSxPQUFBLDBCQUFBLGFBQUE7OztRQUdBLE9BQUEsY0FBQSxVQUFBLE9BQUEsR0FBQTtZQUNBLFVBQUE7WUFDQSxFQUFBO1lBQ0EsTUFBQSxPQUFBLENBQUEsSUFBQSxNQUFBLEtBQUEsWUFBQTtnQkFDQSxhQUFBO2VBQ0E7OztRQUdBLE9BQUEsWUFBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsT0FBQSxlQUFBLFlBQUE7WUFDQSxVQUFBOzs7UUFHQSxPQUFBLGNBQUEsWUFBQTtZQUNBLFVBQUE7OztRQUdBOzs7Ozs7Ozs7OztBQzNJQSxRQUFBLE9BQUEsc0JBQUEsV0FBQSxvREFBQSxVQUFBLFFBQUEsYUFBQTtRQUNBOztRQUVBLElBQUEsV0FBQTtZQUNBLE9BQUE7WUFDQSxNQUFBOzs7UUFHQSxPQUFBLFdBQUE7WUFDQSxPQUFBLFNBQUE7WUFDQSxPQUFBLFlBQUE7WUFDQSxNQUFBLFNBQUE7OztRQUdBLElBQUEsMkJBQUEsWUFBQTtZQUNBLE9BQUE7Ozs7WUFJQSxJQUFBLENBQUEsT0FBQSxTQUFBLFNBQUEsQ0FBQSxNQUFBLE9BQUEsU0FBQSxNQUFBLFdBQUEsT0FBQSxTQUFBLE9BQUE7Z0JBQ0EsT0FBQTs7OztRQUlBLE9BQUEsY0FBQSxZQUFBO1lBQ0EsT0FBQSxZQUFBLFNBQUE7OztRQUdBLE9BQUEsZUFBQSxZQUFBO1lBQ0EsT0FBQSxTQUFBLFFBQUEsWUFBQTs7O1FBR0EsT0FBQSxZQUFBLFlBQUE7WUFDQSxPQUFBLFNBQUEsT0FBQSxTQUFBOzs7UUFHQSxPQUFBLGNBQUEsWUFBQTtZQUNBLE9BQUEsT0FBQSxTQUFBLFNBQUEsU0FBQTs7O1FBR0EsT0FBQSxnQkFBQSxZQUFBO1lBQ0EsT0FBQSxPQUFBLFNBQUEsVUFBQSxTQUFBOzs7UUFHQSxPQUFBLFdBQUEsWUFBQTtZQUNBLElBQUEsUUFBQTtnQkFDQSxNQUFBLE9BQUEsU0FBQTtnQkFDQSxPQUFBLE9BQUEsU0FBQTs7O1lBR0EsSUFBQSxPQUFBLFNBQUEsT0FBQTtnQkFDQSxNQUFBLFlBQUEsT0FBQSxTQUFBLE1BQUE7OztZQUdBLE9BQUEsWUFBQSxPQUFBLEtBQUE7OztRQUdBLE9BQUEsSUFBQSxtQkFBQSxVQUFBLEdBQUEsT0FBQTtZQUNBLE9BQUEsU0FBQSxRQUFBO1lBQ0EsSUFBQSxPQUFBO2dCQUNBLE9BQUEsU0FBQSxRQUFBLE1BQUEsTUFBQTs7Ozs7Ozs7Ozs7OztBQzVEQSxRQUFBLE9BQUEsc0JBQUEsV0FBQSxnSUFBQSxVQUFBLFFBQUEsWUFBQSxTQUFBLE9BQUEsaUJBQUEsU0FBQSxlQUFBLEtBQUEsTUFBQTtRQUNBOztRQUVBLElBQUEsVUFBQTtRQUNBLElBQUEsVUFBQTs7UUFFQSxPQUFBLFlBQUE7WUFDQSxNQUFBO1lBQ0EsU0FBQSxnQkFBQTs7O1FBR0EsSUFBQSxjQUFBLFVBQUEsVUFBQTtZQUNBLElBQUEsY0FBQTtZQUNBLFVBQUE7OztRQUdBLElBQUEsY0FBQSxVQUFBLFFBQUE7WUFDQSxPQUFBLFVBQUEsU0FBQSxPQUFBO1lBQ0EsVUFBQTs7O1FBR0EsSUFBQSxtQkFBQSxVQUFBLFFBQUEsVUFBQTtZQUNBLE9BQUEsY0FBQSxPQUFBLFFBQUE7WUFDQSxZQUFBOzs7UUFHQSxJQUFBLGdCQUFBLFVBQUEsUUFBQTtZQUNBLEtBQUEsSUFBQSxJQUFBLFFBQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO2dCQUNBLElBQUEsUUFBQSxHQUFBLE9BQUEsT0FBQSxJQUFBO29CQUNBLFFBQUEsT0FBQSxHQUFBO29CQUNBOzs7WUFHQSxVQUFBOzs7UUFHQSxJQUFBLGlCQUFBLFVBQUEsTUFBQTtZQUNBLEtBQUEsSUFBQSxJQUFBLFFBQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO2dCQUNBLElBQUEsUUFBQSxHQUFBLE9BQUEsS0FBQSxJQUFBO29CQUNBLE9BQUE7Ozs7WUFJQSxPQUFBOzs7UUFHQSxJQUFBLHlCQUFBLFVBQUEsT0FBQTtZQUNBLE9BQUEsTUFBQSxPQUFBOzs7UUFHQSxJQUFBLGlCQUFBLFVBQUEsUUFBQTtZQUNBLE9BQUEsY0FBQSxPQUFBLFFBQUE7WUFDQSxRQUFBLEtBQUE7WUFDQSxPQUFBLFVBQUEsT0FBQTtZQUNBLFVBQUE7OztRQUdBLE9BQUEsWUFBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsT0FBQSxnQkFBQSxZQUFBO1lBQ0EsVUFBQSxDQUFBOzs7UUFHQSxPQUFBLFlBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLE9BQUEsYUFBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsT0FBQSxhQUFBLFlBQUE7WUFDQSxPQUFBLFFBQUEsU0FBQTs7O1FBR0EsT0FBQSxXQUFBLFlBQUE7WUFDQSxPQUFBOzs7UUFHQSxPQUFBLFVBQUEsVUFBQSxJQUFBO1lBQ0EsT0FBQSxNQUFBOzs7UUFHQSxPQUFBLFlBQUEsVUFBQSxRQUFBO1lBQ0EsT0FBQSxZQUFBLE9BQUE7OztRQUdBLE9BQUEsYUFBQSxVQUFBLFFBQUE7WUFDQSxVQUFBO1lBQ0EsY0FBQTtnQkFDQSxDQUFBLGVBQUEsV0FBQTtnQkFDQSxDQUFBLElBQUEsT0FBQSxJ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WUFBQTtZQUNBLE9BQUEsU0FBQSxRQUFBLFlBQUE7OztRQUdBLE9BQUEsY0FBQSxZQUFBO1lBQ0EsT0FBQSxPQUFBLFNBQUEsU0FBQSxTQUFBOzs7UUFHQSxPQUFBLGdCQUFBLFlBQUE7WUFDQSxPQUFBLE9BQUEsU0FBQSxVQUFBLFNBQUE7OztRQUdBLE9BQUEsa0JBQUEsWUFBQTtZQUNBLFlBQUEsQ0FBQTs7O1FBR0EsT0FBQSxjQUFBLFlBQUE7WUFDQSxPQUFBOzs7UUFHQSxPQUFBLFdBQUEsVUFBQSxNQUFBO1lBQ0EsSUFBQSxRQUFBO2dCQUNBLE1BQUEsS0FBQTtnQkFDQSxPQUFBLE9BQUEsU0FBQTtnQkFDQSxXQUFBLEtBQUE7Z0JBQ0EsaUJBQUEsT0FBQTs7O1lBR0EsSUFBQSxXQUFBO2dCQUNBLE1BQUEsWUFBQTttQkFDQSxJQUFBLE9BQUEsU0FBQSxPQUFBO2dCQUNBLE1BQUEsWUFBQSxPQUFBLFNBQUEsTUFBQTs7O1lBR0EsT0FBQSxZQUFBLE9BQUEsS0FBQTs7O1FBR0EsT0FBQSxvQkFBQSxVQUFBLE1BQUE7WUFDQSxJQUFBLE9BQUEsZUFBQTtnQkFDQSxPQUFBLFNBQUEsS0FBQSxPQUFBOzs7WUFHQSxJQUFBLE9BQUEsaUJBQUE7Z0JBQ0EsT0FBQSxTQUFBLEtBQUEsT0FBQSxvQkFBQSxPQUFBLFNBQUEsTUFBQTs7O1lBR0EsT0FBQSxTQUFBLEtBQUEsT0FBQTs7O1FBR0EsT0FBQSxrQkFBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLFlBQUEsUUFBQSxLQUFBLGNBQUEsQ0FBQTs7O1FBR0EsT0FBQSxJQUFBLG1CQUFBLFVBQUEsR0FBQSxPQUFBO1lBQ0EsT0FBQSxTQUFBLFFBQUE7WUFDQSxJQUFBLE9BQUE7Z0JBQ0EsT0FBQSxTQUFBLFFBQUEsTUFBQSxNQUFBOzs7Ozs7Ozs7Ozs7O0FDOUlBLFFBQUEsT0FBQSxzQkFBQSxVQUFBLDREQUFBLFVBQUEsVUFBQSxVQUFBLGdCQUFBO1FBQ0E7O1FBRUEsT0FBQTtZQUNBLFVBQUE7O1lBRUEsYUFBQTs7WUFFQSxPQUFBOztZQUVBLE1BQUEsVUFBQSxPQUFBLFNBQUEsT0FBQTs7OztnQkFJQSxJQUFBLFVBQUEsUUFBQSxRQUFBLGVBQUEsSUFBQTtnQkFDQSxTQUFBLFlBQUE7b0JBQ0EsUUFBQSxPQUFBLFNBQUEsU0FBQTs7OztZQUlBLHVCQUFBLFVBQUEsUUFBQTs7Z0JBRUEsSUFBQSxPQUFBOztnQkFFQSxJQUFBLGFBQUE7O2dCQUVBLElBQUEsV0FBQTs7Z0JBRUEsSUFBQSxhQUFBLFlBQUE7b0JBQ0EsSUFBQSxPQUFBLGNBQUEsUUFBQSxPQUFBLEtBQUEsUUFBQSxDQUFBLEdBQUE7d0JBQ0EsT0FBQTt3QkFDQSxXQUFBOzJCQUNBLElBQUEsT0FBQSxnQkFBQSxPQUFBLE9BQUE7d0JBQ0EsT0FBQTt3QkFDQSxXQUFBOzJCQUNBO3dCQUNBLE9BQUE7d0JBQ0EsV0FBQTs7OztnQkFJQSxJQUFBLGtCQUFBLFlBQUE7b0JBQ0EsYUFBQSxPQUFBLFFBQUEsT0FBQSxLQUFBLGVBQUEsT0FBQSxLQUFBOzs7Z0JBR0EsT0FBQSxhQUFBLFlBQUE7b0JBQ0EsSUFBQSxNQUFBO3dCQUNBLE9BQUEsT0FBQSxLQUFBLE9BQUEsS0FBQTs7O29CQUdBLE9BQUE7Ozs7Z0JBSUEsT0FBQSxXQUFBLFlBQUE7b0JBQ0EsT0FBQTt3QkFDQSxNQUFBO3dCQUNBLFlBQUE7d0JBQ0EsVUFBQTs7OztnQkFJQSxPQUFBLElBQUEsbUJBQUE7Z0JBQ0EsT0FBQSxJQUFBLGtCQUFBO2dCQUNBO2dCQUNBOzs7Ozs7Ozs7Ozs7O0FDakVBLFFBQUEsT0FBQSxzQkFBQSxRQUFBLGVBQUEsWUFBQTtRQUNBOzs7UUFHQSxJQUFBLE1BQUEsQ0FBQSxHQUFBLEtBQUE7UUFDQSxJQUFBLE1BQUEsQ0FBQSxLQUFBLEdBQUE7OztRQUdBLElBQUEsWUFBQSxDQUFBLEdBQUEsR0FBQTs7O1FBR0EsSUFBQSxRQUFBLFVBQUEsS0FBQTs7WUFFQSxJQUFBLE1BQUEsSUFBQSxLQUFBO1lBQ0EsSUFBQSxLQUFBLEtBQUEsTUFBQTtZQUNBLElBQUEsSUFBQSxNQUFBO1lBQ0EsSUFBQSxNQUFBO2dCQUNBLElBQUEsTUFBQSxJQUFBLElBQUE7Z0JBQ0EsSUFBQSxNQUFBLElBQUEsSUFBQSxLQUFBO2dCQUNBLElBQUEsTUFBQSxJQUFBLElBQUEsTUFBQSxJQUFBOzs7WUFHQSxJQUFBOztZQUVBLFFBQUE7Z0JBQ0EsS0FBQTtvQkFDQSxNQUFBLENBQUEsSUFBQSxJQUFBLElBQUEsSUFBQSxJQUFBO29CQUNBO2dCQUNBLEtBQUE7b0JBQ0EsTUFBQSxDQUFBLElBQUEsSUFBQSxJQUFBLElBQUEsSUFBQTtvQkFDQTtnQkFDQSxLQUFBO29CQUNBLE1BQUEsQ0FBQSxJQUFBLElBQUEsSUFBQSxJQUFBLElBQUE7b0JBQ0E7Z0JBQ0EsS0FBQTtvQkFDQSxNQUFBLENBQUEsSUFBQSxJQUFBLElBQUEsSUFBQSxJQUFBO29CQUNBO2dCQUNBLEtBQUE7b0JBQ0EsTUFBQSxDQUFBLElBQUEsSUFBQSxJQUFBLElBQUEsSUFBQTtvQkFDQTtnQkFDQTtvQkFDQSxNQUFBLENBQUEsSUFBQSxJQUFBLElBQUEsSUFBQSxJQUFBOzs7WUFHQSxPQUFBLElBQUEsSUFBQSxTQUFBLE1BQUE7Z0JBQ0EsT0FBQSxLQUFBLE1BQUEsT0FBQTs7OztRQUlBLElBQUEsUUFBQSxVQUFBLEtBQUE7WUFDQSxPQUFBLElBQUEsSUFBQSxVQUFBLE1BQUE7Z0JBQ0EsT0FBQSxLQUFBLFNBQUE7Z0JBQ0EsT0FBQSxDQUFBLEtBQUEsV0FBQSxNQUFBLE1BQUEsUUFBQTs7OztRQUlBLEtBQUEsTUFBQSxZQUFBO1lBQ0EsSUFBQSxRQUFBLENBQUEsR0FBQSxHQUFBO1lBQ0EsSUFBQTtZQUNBLEtBQUEsSUFBQSxJQUFBLE1BQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO2dCQUNBLFlBQUEsS0FBQSxVQUFBO2dCQUNBLE1BQUEsS0FBQSxDQUFBLElBQUEsS0FBQSxJQUFBLE1BQUEsS0FBQSxXQUFBLElBQUE7Z0JBQ0EsSUFBQSxjQUFBLEdBQUE7b0JBQ0EsTUFBQSxLQUFBLEtBQUEsTUFBQSxNQUFBLEtBQUEsYUFBQTt1QkFDQTtvQkFDQSxNQUFBLEtBQUEsS0FBQSxNQUFBLE1BQUE7Ozs7WUFJQSxPQUFBLE1BQUEsTUFBQSxNQUFBLFFBQUEsS0FBQTs7OztBQUlBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRoZSBwYW5lbCBmb3IgZWRpdGluZyB0aGUgbGFiZWxzIG9mIGEgbGFiZWwgdHJlZVxuICovXG5iaWlnbGUuJHZpZXdNb2RlbCgnbGFiZWwtdHJlZXMtbGFiZWxzJywgZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICB2YXIgbGFiZWxzID0gYmlpZ2xlLiRyZXF1aXJlKCdhcGkubGFiZWxzJyk7XG4gICAgdmFyIG1lc3NhZ2VzID0gYmlpZ2xlLiRyZXF1aXJlKCdtZXNzYWdlcy5zdG9yZScpO1xuXG4gICAgbmV3IFZ1ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBlZGl0aW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGxvYWRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgbGFiZWxzOiBiaWlnbGUuJHJlcXVpcmUoJ2xhYmVsVHJlZXMubGFiZWxzJyksXG4gICAgICAgIH0sXG4gICAgICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgICAgIHR5cGVhaGVhZDogVnVlU3RyYXAudHlwZWFoZWFkLFxuICAgICAgICAgICAgdGFiczogVnVlU3RyYXAudGFicyxcbiAgICAgICAgICAgIHRhYjogVnVlU3RyYXAudGFiLFxuICAgICAgICAgICAgbGFiZWxUcmVlOiBiaWlnbGUuJHJlcXVpcmUoJ2xhYmVsVHJlZXMuY29tcG9uZW50cy5sYWJlbFRyZWUnKSxcbiAgICAgICAgfSxcbiAgICAgICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgICAgIGNsYXNzT2JqZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgJ3BhbmVsLXdhcm5pbmcnOiB0aGlzLmVkaXRpbmdcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGF1dGhvcml6YWJsZVByb2plY3RzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBtZXRob2RzOiB7XG4gICAgICAgICAgICB0b2dnbGVFZGl0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0aW5nID0gIXRoaXMuZWRpdGluZztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmaW5pc2hMb2FkaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVsZXRlTGFiZWw6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGxhYmVscy5kZWxldGUoe2lkOiBsYWJlbC5pZH0pXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubGFiZWxEZWxldGVkKGxhYmVsKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgbWVzc2FnZXMuaGFuZGxlRXJyb3JSZXNwb25zZSlcbiAgICAgICAgICAgICAgICAgICAgLmZpbmFsbHkodGhpcy5maW5pc2hMb2FkaW5nKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsYWJlbERlbGV0ZWQ6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSB0aGlzLmxhYmVscy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5sYWJlbHNbaV0uaWQgPT09IGxhYmVsLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhYmVscy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQGRlc2NyaXB0aW9uIFRoZSBCSUlHTEUgbGFiZWwgdHJlZXMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnYmlpZ2xlLmxhYmVsLXRyZWVzJywgWydiaWlnbGUuYXBpJywgJ2JpaWdsZS51aSddKTtcblxuLypcbiAqIERpc2FibGUgZGVidWcgaW5mbyBpbiBwcm9kdWN0aW9uIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2UuXG4gKiBzZWU6IGh0dHBzOi8vY29kZS5hbmd1bGFyanMub3JnLzEuNC43L2RvY3MvZ3VpZGUvcHJvZHVjdGlvblxuICovXG5hbmd1bGFyLm1vZHVsZSgnYmlpZ2xlLmxhYmVsLXRyZWVzJykuY29uZmlnKGZ1bmN0aW9uICgkY29tcGlsZVByb3ZpZGVyKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAkY29tcGlsZVByb3ZpZGVyLmRlYnVnSW5mb0VuYWJsZWQoZmFsc2UpO1xufSk7XG4iLCIvKipcbiAqIEEgY29tcG9uZW50IHRoYXQgZGlzcGxheXMgYSBsYWJlbCB0cmVlLiBUaGUgbGFiZWxzIGNhbiBiZSBzZWFyY2hlZCBhbmQgc2VsZWN0ZWQuXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuYmlpZ2xlLiRjb21wb25lbnQoJ2xhYmVsVHJlZXMuY29tcG9uZW50cy5sYWJlbFRyZWUnLCB7XG4gICAgdGVtcGxhdGU6ICc8ZGl2IGNsYXNzPVwibGFiZWwtdHJlZVwiPicgK1xuICAgICAgICAnPGg0IGNsYXNzPVwibGFiZWwtdHJlZV9fdGl0bGVcIiB2LWlmPVwic2hvd1RpdGxlXCI+JyArXG4gICAgICAgICAgICAnPGJ1dHRvbiB2LWlmPVwiY29sbGFwc2libGVcIiBAY2xpY2suc3RvcD1cImNvbGxhcHNlXCIgY2xhc3M9XCJidG4gYnRuLWRlZmF1bHQgYnRuLXhzIHB1bGwtcmlnaHRcIiA6dGl0bGU9XCJjb2xsYXBzZVRpdGxlXCI+JyArXG4gICAgICAgICAgICAgICAgJzxzcGFuIHYtaWY9XCJjb2xsYXBzZWRcIiBjbGFzcz1cImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1kb3duXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9zcGFuPicgK1xuICAgICAgICAgICAgICAgICc8c3BhbiB2LWVsc2UgY2xhc3M9XCJnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tdXBcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+JyArXG4gICAgICAgICAgICAnPC9idXR0b24+JyArXG4gICAgICAgICAgICAne3tuYW1lfX0nICtcbiAgICAgICAgJzwvaDQ+JyArXG4gICAgICAgICc8dWwgdi1pZj1cIiFjb2xsYXBzZWRcIiBjbGFzcz1cImxhYmVsLXRyZWVfX2xpc3RcIj4nICtcbiAgICAgICAgICAgICc8bGFiZWwtdHJlZS1sYWJlbCA6bGFiZWw9XCJsYWJlbFwiIDpkZWxldGFibGU9XCJkZWxldGFibGVcIiB2LWZvcj1cImxhYmVsIGluIHJvb3RMYWJlbHNcIiBAc2VsZWN0PVwiZW1pdFNlbGVjdFwiIEBkZXNlbGVjdD1cImVtaXREZXNlbGVjdFwiIEBkZWxldGU9XCJlbWl0RGVsZXRlXCI+PC9sYWJlbC10cmVlLWxhYmVsPicgK1xuICAgICAgICAnPC91bD4nICtcbiAgICAnPC9kaXY+JyxcbiAgICBkYXRhOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb2xsYXBzZWQ6IGZhbHNlXG4gICAgICAgIH07XG4gICAgfSxcbiAgICBjb21wb25lbnRzOiB7XG4gICAgICAgIGxhYmVsVHJlZUxhYmVsOiBiaWlnbGUuJHJlcXVpcmUoJ2xhYmVsVHJlZXMuY29tcG9uZW50cy5sYWJlbFRyZWVMYWJlbCcpLFxuICAgIH0sXG4gICAgcHJvcHM6IHtcbiAgICAgICAgbmFtZToge1xuICAgICAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIGxhYmVsczoge1xuICAgICAgICAgICAgdHlwZTogQXJyYXksXG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgc2hvd1RpdGxlOiB7XG4gICAgICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgc3RhbmRhbG9uZToge1xuICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICBjb2xsYXBzaWJsZToge1xuICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIG11bHRpc2VsZWN0OiB7XG4gICAgICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIGRlbGV0YWJsZToge1xuICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICB9XG4gICAgfSxcbiAgICBjb21wdXRlZDoge1xuICAgICAgICBsYWJlbE1hcDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG1hcCA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMubGFiZWxzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgbWFwW3RoaXMubGFiZWxzW2ldLmlkXSA9IHRoaXMubGFiZWxzW2ldO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbWFwO1xuICAgICAgICB9LFxuICAgICAgICBjb21waWxlZExhYmVsczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNvbXBpbGVkID0ge307XG4gICAgICAgICAgICB2YXIgcGFyZW50O1xuICAgICAgICAgICAgLy8gQ3JlYXRlIGRhdGFzdHJ1Y3R1cmUgdGhhdCBtYXBzIGxhYmVsIElEcyB0byB0aGUgY2hpbGQgbGFiZWxzLlxuICAgICAgICAgICAgLy8gR28gZnJvbSAwIHRvIGxlbmd0aCBzbyB0aGUgbGFiZWxzIGFyZSBrZXB0IGluIG9yZGVyLlxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IHRoaXMubGFiZWxzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50ID0gdGhpcy5sYWJlbHNbaV0ucGFyZW50X2lkO1xuICAgICAgICAgICAgICAgIGlmIChjb21waWxlZC5oYXNPd25Qcm9wZXJ0eShwYXJlbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBpbGVkW3BhcmVudF0ucHVzaCh0aGlzLmxhYmVsc1tpXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGlsZWRbcGFyZW50XSA9IFt0aGlzLmxhYmVsc1tpXV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB1cGRhdGUgdGhlIGxhYmVsIGNoaWxkcmVuIHdpdGggdGhlIGNvbXBpbGVkIGRhdGFzdHJ1Y3R1cmVcbiAgICAgICAgICAgIGZvciAoaSA9IHRoaXMubGFiZWxzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBpbGVkLmhhc093blByb3BlcnR5KHRoaXMubGFiZWxzW2ldLmlkKSkge1xuICAgICAgICAgICAgICAgICAgICBWdWUuc2V0KHRoaXMubGFiZWxzW2ldLCAnY2hpbGRyZW4nLCBjb21waWxlZFt0aGlzLmxhYmVsc1tpXS5pZF0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIFZ1ZS5zZXQodGhpcy5sYWJlbHNbaV0sICdjaGlsZHJlbicsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY29tcGlsZWQ7XG4gICAgICAgIH0sXG4gICAgICAgIHJvb3RMYWJlbHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbXBpbGVkTGFiZWxzW251bGxdO1xuICAgICAgICB9LFxuICAgICAgICBjb2xsYXBzZVRpdGxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb2xsYXBzZWQgPyAnRXhwYW5kJyA6ICdDb2xsYXBzZSc7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgaGFzTGFiZWw6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFiZWxNYXAuaGFzT3duUHJvcGVydHkoaWQpO1xuICAgICAgICB9LFxuICAgICAgICBnZXRMYWJlbDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYWJlbE1hcFtpZF07XG4gICAgICAgIH0sXG4gICAgICAgIGdldFBhcmVudHM6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgdmFyIHBhcmVudHMgPSBbXTtcbiAgICAgICAgICAgIHdoaWxlIChsYWJlbC5wYXJlbnRfaWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBsYWJlbCA9IHRoaXMuZ2V0TGFiZWwobGFiZWwucGFyZW50X2lkKTtcbiAgICAgICAgICAgICAgICBwYXJlbnRzLnVuc2hpZnQobGFiZWwuaWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcGFyZW50cztcbiAgICAgICAgfSxcbiAgICAgICAgZW1pdFNlbGVjdDogZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLiRlbWl0KCdzZWxlY3QnLCBsYWJlbCk7XG4gICAgICAgIH0sXG4gICAgICAgIGVtaXREZXNlbGVjdDogZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLiRlbWl0KCdkZXNlbGVjdCcsIGxhYmVsKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW1pdERlbGV0ZTogZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLiRlbWl0KCdkZWxldGUnLCBsYWJlbCk7XG4gICAgICAgIH0sXG4gICAgICAgIHNlbGVjdExhYmVsOiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5tdWx0aXNlbGVjdCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJTZWxlY3RlZExhYmVscygpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUaGUgc2VsZWN0ZWQgbGFiZWwgZG9lcyBub3QgbmVzc2VjYXJpbHkgYmVsb25nIHRvIHRoaXMgbGFiZWwgdHJlZSBzaW5jZVxuICAgICAgICAgICAgLy8gdGhlIHRyZWUgbWF5IGJlIGRpc3BsYXllZCBpbiBhIGxhYmVsLXRyZWVzIGNvbXBvbmVudCB3aXRoIG90aGVyIHRyZWVzLlxuICAgICAgICAgICAgaWYgKHRoaXMuaGFzTGFiZWwobGFiZWwuaWQpKSB7XG4gICAgICAgICAgICAgICAgbGFiZWwuc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuY29sbGFwc2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudHMgPSB0aGlzLmdldFBhcmVudHMobGFiZWwpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBwYXJlbnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0TGFiZWwocGFyZW50c1tpXSkub3BlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBkZXNlbGVjdExhYmVsOiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmhhc0xhYmVsKGxhYmVsLmlkKSkge1xuICAgICAgICAgICAgICAgIGxhYmVsLnNlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNsZWFyU2VsZWN0ZWRMYWJlbHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSB0aGlzLmxhYmVscy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIHRoaXMubGFiZWxzW2ldLnNlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNvbGxhcHNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmNvbGxhcHNlZCA9ICF0aGlzLmNvbGxhcHNlZDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY3JlYXRlZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBTZXQgdGhlIGxhYmVsIHByb3BlcnRpZXNcbiAgICAgICAgZm9yIChpID0gdGhpcy5sYWJlbHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIFZ1ZS5zZXQodGhpcy5sYWJlbHNbaV0sICdvcGVuJywgZmFsc2UpO1xuICAgICAgICAgICAgVnVlLnNldCh0aGlzLmxhYmVsc1tpXSwgJ3NlbGVjdGVkJywgZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIGxhYmVsIHRyZWUgY2FuIGJlIHVzZWQgaW4gYSBsYWJlbC10cmVlcyBjb21wb25lbnQgb3IgYXMgYSBzaW5nbGUgbGFiZWxcbiAgICAgICAgLy8gdHJlZS4gSW4gYSBsYWJlbC10cmVlcyBjb21wb25lbnQgb25seSBvbmUgbGFiZWwgY2FuIGJlIHNlbGVjdGVkIGluIGFsbCBsYWJlbFxuICAgICAgICAvLyB0cmVlcyBzbyB0aGUgcGFyZW50IGhhbmRsZXMgdGhlIGV2ZW50LiBBIHNpbmdsZSBsYWJlbCB0cmVlIGhhbmRsZXMgdGhlIGV2ZW50XG4gICAgICAgIC8vIGJ5IGl0c2VsZi5cbiAgICAgICAgaWYgKHRoaXMuc3RhbmRhbG9uZSkge1xuICAgICAgICAgICAgdGhpcy4kb24oJ3NlbGVjdCcsIHRoaXMuc2VsZWN0TGFiZWwpO1xuICAgICAgICAgICAgdGhpcy4kb24oJ2Rlc2VsZWN0JywgdGhpcy5kZXNlbGVjdExhYmVsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJHBhcmVudC4kb24oJ3NlbGVjdCcsIHRoaXMuc2VsZWN0TGFiZWwpO1xuICAgICAgICAgICAgdGhpcy4kcGFyZW50LiRvbignZGVzZWxlY3QnLCB0aGlzLmRlc2VsZWN0TGFiZWwpO1xuICAgICAgICAgICAgdGhpcy4kcGFyZW50LiRvbignY2xlYXInLCB0aGlzLmNsZWFyU2VsZWN0ZWRMYWJlbHMpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG4iLCIvKipcbiAqIEEgY29tcG9uZW50IHRoYXQgZGlzcGxheXMgYSBzaW5nbGUgbGFiZWwgb2YgYSBsYWJlbCB0cmVlLlxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbmJpaWdsZS4kY29tcG9uZW50KCdsYWJlbFRyZWVzLmNvbXBvbmVudHMubGFiZWxUcmVlTGFiZWwnLCB7XG4gICAgbmFtZTogJ2xhYmVsLXRyZWUtbGFiZWwnLFxuICAgIHRlbXBsYXRlOiAnPGxpIGNsYXNzPVwibGFiZWwtdHJlZS1sYWJlbCBjZlwiIDpjbGFzcz1cImNsYXNzT2JqZWN0XCI+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwibGFiZWwtdHJlZS1sYWJlbF9fbmFtZVwiIEBjbGljaz1cInRvZ2dsZU9wZW5cIj4nICtcbiAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImxhYmVsLXRyZWUtbGFiZWxfX2NvbG9yXCIgOnN0eWxlPVwiY29sb3JTdHlsZVwiPjwvc3Bhbj4nICtcbiAgICAgICAgICAgICc8c3BhbiB2LXRleHQ9XCJsYWJlbC5uYW1lXCIgQGNsaWNrLnN0b3A9XCJ0b2dnbGVTZWxlY3RcIj48L3NwYW4+JyArXG4gICAgICAgICAgICAnPHNwYW4gdi1pZj1cInNob3dGYXZvdXJpdGVcIiBjbGFzcz1cImxhYmVsLXRyZWUtbGFiZWxfX2Zhdm91cml0ZVwiIEBjbGljay5zdG9wPVwidG9nZ2xlRmF2b3VyaXRlXCI+JyArXG4gICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwiZ2x5cGhpY29uXCIgOmNsYXNzPVwiZmF2b3VyaXRlQ2xhc3NcIiBhcmlhLWhpZGRlbj1cInRydWVcIiB0aXRsZT1cIlwiPjwvc3Bhbj4nICtcbiAgICAgICAgICAgICc8L3NwYW4+JyArXG4gICAgICAgICAgICAnPGJ1dHRvbiB2LWlmPVwiZGVsZXRhYmxlXCIgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiY2xvc2UgbGFiZWwtdHJlZS1sYWJlbF9fZGVsZXRlXCIgOnRpdGxlPVwiZGVsZXRlVGl0bGVcIiBAY2xpY2suc3RvcD1cImRlbGV0ZVRoaXNcIj48c3BhbiBhcmlhLWhpZGRlbj1cInRydWVcIj4mdGltZXM7PC9zcGFuPjwvYnV0dG9uPicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8dWwgdi1pZj1cImxhYmVsLm9wZW5cIiBjbGFzcz1cImxhYmVsLXRyZWVfX2xpc3RcIj4nICtcbiAgICAgICAgICAgICc8bGFiZWwtdHJlZS1sYWJlbCA6bGFiZWw9XCJjaGlsZFwiIDpkZWxldGFibGU9XCJkZWxldGFibGVcIiB2LWZvcj1cImNoaWxkIGluIGxhYmVsLmNoaWxkcmVuXCIgQHNlbGVjdD1cImVtaXRTZWxlY3RcIiBAZGVzZWxlY3Q9XCJlbWl0RGVzZWxlY3RcIiBAZGVsZXRlPVwiZW1pdERlbGV0ZVwiPjwvbGFiZWwtdHJlZS1sYWJlbD4nICtcbiAgICAgICAgJzwvdWw+JyArXG4gICAgJzwvbGk+JyxcbiAgICBkYXRhOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmYXZvdXJpdGU6IGZhbHNlXG4gICAgICAgIH07XG4gICAgfSxcbiAgICBwcm9wczoge1xuICAgICAgICBsYWJlbDoge1xuICAgICAgICAgICAgdHlwZTogT2JqZWN0LFxuICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHNob3dGYXZvdXJpdGU6IHtcbiAgICAgICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIGRlbGV0YWJsZToge1xuICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICB9XG4gICAgfSxcbiAgICBjb21wdXRlZDoge1xuICAgICAgICBjbGFzc09iamVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAnbGFiZWwtdHJlZS1sYWJlbC0tc2VsZWN0ZWQnOiB0aGlzLmxhYmVsLnNlbGVjdGVkLFxuICAgICAgICAgICAgICAgICdsYWJlbC10cmVlLWxhYmVsLS1leHBhbmRhYmxlJzogdGhpcy5sYWJlbC5jaGlsZHJlbixcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIGNvbG9yU3R5bGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiAnIycgKyB0aGlzLmxhYmVsLmNvbG9yXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICBmYXZvdXJpdGVDbGFzczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAnZ2x5cGhpY29uLXN0YXItZW1wdHknOiAhdGhpcy5mYXZvdXJpdGUsXG4gICAgICAgICAgICAgICAgJ2dseXBoaWNvbi1zdGFyJzogdGhpcy5mYXZvdXJpdGUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICBkZWxldGVUaXRsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICdSZW1vdmUgbGFiZWwgJyArIHRoaXMubGFiZWwubmFtZTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICB0b2dnbGVTZWxlY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5sYWJlbC5zZWxlY3RlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuJGVtaXQoJ3NlbGVjdCcsIHRoaXMubGFiZWwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLiRlbWl0KCdkZXNlbGVjdCcsIHRoaXMubGFiZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvLyBhIG1ldGhvZCBjYWxsZWQgJ2RlbGV0ZScgZGlkbid0IHdvcmtcbiAgICAgICAgZGVsZXRlVGhpczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5lbWl0RGVsZXRlKHRoaXMubGFiZWwpO1xuICAgICAgICB9LFxuICAgICAgICB0b2dnbGVPcGVuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgbGFiZWwgY2Fubm90IGJlIG9wZW5lZCwgaXQgd2lsbCBiZSBzZWxlY3RlZCBoZXJlIGluc3RlYWQuXG4gICAgICAgICAgICBpZiAoIXRoaXMubGFiZWwuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVNlbGVjdCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxhYmVsLm9wZW4gPSAhdGhpcy5sYWJlbC5vcGVuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0b2dnbGVGYXZvdXJpdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuZmF2b3VyaXRlID0gIXRoaXMuZmF2b3VyaXRlO1xuICAgICAgICB9LFxuICAgICAgICBlbWl0U2VsZWN0OiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIC8vIGJ1YmJsZSB0aGUgZXZlbnQgdXB3YXJkc1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgnc2VsZWN0JywgbGFiZWwpO1xuICAgICAgICB9LFxuICAgICAgICBlbWl0RGVzZWxlY3Q6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgLy8gYnViYmxlIHRoZSBldmVudCB1cHdhcmRzXG4gICAgICAgICAgICB0aGlzLiRlbWl0KCdkZXNlbGVjdCcsIGxhYmVsKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW1pdERlbGV0ZTogZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICAvLyBidWJibGUgdGhlIGV2ZW50IHVwd2FyZHNcbiAgICAgICAgICAgIHRoaXMuJGVtaXQoJ2RlbGV0ZScsIGxhYmVsKTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuIiwiLyoqXG4gKiBSZXNvdXJjZSBmb3IgbGFiZWxzLlxuICpcbiAqIHZhciByZXNvdXJjZSA9IGJpaWdsZS4kcmVxdWlyZSgnYXBpLmxhYmVscycpO1xuICpcbiAqIENyZWF0ZSBhIGxhYmVsOlxuICpcbiAqIHJlc291cmNlLnNhdmUoe2xhYmVsX3RyZWVfaWQ6IDF9LCB7XG4gKiAgICAgbmFtZTogXCJUcmFzaFwiLFxuICogICAgIGNvbG9yOiAnYmFkYTU1J1xuICogfSkudGhlbiguLi4pO1xuICpcbiAqIERlbGV0ZSBhIGxhYmVsOlxuICpcbiAqIHJlc291cmNlLmRlbGV0ZSh7aWQ6IGxhYmVsSWR9KS50aGVuKC4uLik7XG4gKlxuICogQHR5cGUge1Z1ZS5yZXNvdXJjZX1cbiAqL1xuYmlpZ2xlLiRkZWNsYXJlKCdhcGkubGFiZWxzJywgVnVlLnJlc291cmNlKCcvYXBpL3YxL2xhYmVsc3svaWR9Jywge30sIHtcbiAgICBzYXZlOiB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICB1cmw6ICcvYXBpL3YxL2xhYmVsLXRyZWVzey9sYWJlbF90cmVlX2lkfS9sYWJlbHMnLFxuICAgIH1cbn0pKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBiaWlnbGUubGFiZWwtdHJlZXNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBBdXRob3JpemVkUHJvamVjdHNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgYmlpZ2xlLmxhYmVsLXRyZWVzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHRoZSBhdXRvcml6ZWQgcHJvamVjdHMgb2YgYSBsYWJlbCB0cmVlXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdiaWlnbGUubGFiZWwtdHJlZXMnKS5jb250cm9sbGVyKCdBdXRob3JpemVkUHJvamVjdHNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgTEFCRUxfVFJFRSwgQVVUSF9QUk9KRUNUUywgQVVUSF9PV05fUFJPSkVDVFMsIFByb2plY3QsIExhYmVsVHJlZUF1dGhvcml6ZWRQcm9qZWN0KSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBlZGl0aW5nID0gZmFsc2U7XG4gICAgICAgIHZhciBsb2FkaW5nID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIG93blByb2plY3RzID0gbnVsbDtcblxuICAgICAgICAvLyBhbGwgcHJvamVjdHMgdGhlIGN1cnJlbnQgdXNlciBiZWxvbmdzIHRvIGFuZCB0aGF0IGFyZSBub3QgYWxyZWFkeSBhdXRob3JpemVkXG4gICAgICAgIHZhciBwcm9qZWN0c0ZvckF1dGhvcml6YXRpb24gPSBudWxsO1xuXG4gICAgICAgIHZhciBwcm9qZWN0SXNOb3RBdXRob3JpemVkID0gZnVuY3Rpb24gKHByb2plY3QpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBBVVRIX1BST0pFQ1RTLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKEFVVEhfUFJPSkVDVFNbaV0uaWQgPT09IHByb2plY3QuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHVwZGF0ZVByb2plY3RzRm9yQXV0aG9yaXphdGlvbiA9IGZ1bmN0aW9uIChwcm9qZWN0cykge1xuICAgICAgICAgICAgcHJvamVjdHNGb3JBdXRob3JpemF0aW9uID0gcHJvamVjdHMuZmlsdGVyKHByb2plY3RJc05vdEF1dGhvcml6ZWQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBoYW5kbGVFcnJvciA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgbXNnLnJlc3BvbnNlRXJyb3IocmVzcG9uc2UpO1xuICAgICAgICAgICAgbG9hZGluZyA9IGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBwcm9qZWN0QWRkZWQgPSBmdW5jdGlvbiAocHJvamVjdCkge1xuICAgICAgICAgICAgQVVUSF9QUk9KRUNUUy5wdXNoKHByb2plY3QpO1xuICAgICAgICAgICAgLy8gdXNlciBjYW4gb25seSBhdXRob3JpemUgb3duIHByb2plY3RzXG4gICAgICAgICAgICBBVVRIX09XTl9QUk9KRUNUUy5wdXNoKHByb2plY3QuaWQpO1xuICAgICAgICAgICAgdXBkYXRlUHJvamVjdHNGb3JBdXRob3JpemF0aW9uKG93blByb2plY3RzKTtcbiAgICAgICAgICAgIGxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcHJvamVjdFJlbW92ZWQgPSBmdW5jdGlvbiAocHJvamVjdCkge1xuICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICBmb3IgKGkgPSBBVVRIX1BST0pFQ1RTLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKEFVVEhfUFJPSkVDVFNbaV0uaWQgPT09IHByb2plY3QuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgQVVUSF9QUk9KRUNUUy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaSA9IEFVVEhfT1dOX1BST0pFQ1RTLmluZGV4T2YocHJvamVjdC5pZCk7XG4gICAgICAgICAgICBpZiAoaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBBVVRIX09XTl9QUk9KRUNUUy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHVwZGF0ZVByb2plY3RzRm9yQXV0aG9yaXphdGlvbihvd25Qcm9qZWN0cyk7XG4gICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmhhc1Byb2plY3RzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIEFVVEhfUFJPSkVDVFMubGVuZ3RoID4gMDtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0UHJvamVjdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gQVVUSF9QUk9KRUNUUztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNPd25Qcm9qZWN0ID0gZnVuY3Rpb24gKHByb2plY3QpIHtcbiAgICAgICAgICAgIHJldHVybiBBVVRIX09XTl9QUk9KRUNUUy5pbmRleE9mKHByb2plY3QuaWQpICE9PSAtMTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNFZGl0aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGVkaXRpbmc7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldFZpc2liaWxpdHlJZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBMQUJFTF9UUkVFLnZpc2liaWxpdHlfaWQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnRvZ2dsZUVkaXRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIW93blByb2plY3RzKSB7XG4gICAgICAgICAgICAgICAgb3duUHJvamVjdHMgPSBQcm9qZWN0LnF1ZXJ5KHVwZGF0ZVByb2plY3RzRm9yQXV0aG9yaXphdGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVkaXRpbmcgPSAhZWRpdGluZztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNMb2FkaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGxvYWRpbmc7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldFByb2plY3RzRm9yQXV0aG9yaXphdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9qZWN0c0ZvckF1dGhvcml6YXRpb247XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmFkZEF1dGhvcml6ZWRQcm9qZWN0ID0gZnVuY3Rpb24gKHByb2plY3QpIHtcbiAgICAgICAgICAgIGxvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgTGFiZWxUcmVlQXV0aG9yaXplZFByb2plY3QuYWRkQXV0aG9yaXplZChcbiAgICAgICAgICAgICAgICB7aWQ6IExBQkVMX1RSRUUuaWR9LFxuICAgICAgICAgICAgICAgIHtpZDogcHJvamVjdC5pZH0sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9qZWN0QWRkZWQocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBoYW5kbGVFcnJvclxuICAgICAgICAgICAgKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUucmVtb3ZlQXV0aG9yaXplZFByb2plY3QgPSBmdW5jdGlvbiAocHJvamVjdCkge1xuICAgICAgICAgICAgbG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICBMYWJlbFRyZWVBdXRob3JpemVkUHJvamVjdC5yZW1vdmVBdXRob3JpemVkKFxuICAgICAgICAgICAgICAgIHtpZDogTEFCRUxfVFJFRS5pZH0sXG4gICAgICAgICAgICAgICAge2lkOiBwcm9qZWN0LmlkfSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb2plY3RSZW1vdmVkKHByb2plY3QpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaGFuZGxlRXJyb3JcbiAgICAgICAgICAgICk7XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBiaWlnbGUubGFiZWwtdHJlZXNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBMYWJlbFRyZWVDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgYmlpZ2xlLmxhYmVsLXRyZWVzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIGxhYmVsIHRyZWUgaW5mb3JtYXRpb25cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2JpaWdsZS5sYWJlbC10cmVlcycpLmNvbnRyb2xsZXIoJ0xhYmVsVHJlZUNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAgTEFCRUxfVFJFRSwgTGFiZWxUcmVlLCBtc2csICR0aW1lb3V0LCBMYWJlbFRyZWVVc2VyLCBVU0VSX0lELCBSRURJUkVDVF9VUkwpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIGVkaXRpbmcgPSBmYWxzZTtcbiAgICAgICAgdmFyIHNhdmluZyA9IGZhbHNlO1xuXG4gICAgICAgICRzY29wZS5sYWJlbFRyZWVJbmZvID0ge1xuICAgICAgICAgICAgbmFtZTogTEFCRUxfVFJFRS5uYW1lLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IExBQkVMX1RSRUUuZGVzY3JpcHRpb24sXG4gICAgICAgICAgICB2aXNpYmlsaXR5X2lkOiBMQUJFTF9UUkVFLnZpc2liaWxpdHlfaWQudG9TdHJpbmcoKVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBoYW5kbGVTYXZpbmdFcnJvciA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgbXNnLnJlc3BvbnNlRXJyb3IocmVzcG9uc2UpO1xuICAgICAgICAgICAgc2F2aW5nID0gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGluZm9VcGRhdGVkID0gZnVuY3Rpb24gKHRyZWUpIHtcbiAgICAgICAgICAgIExBQkVMX1RSRUUubmFtZSA9IHRyZWUubmFtZTtcbiAgICAgICAgICAgIExBQkVMX1RSRUUuZGVzY3JpcHRpb24gPSB0cmVlLmRlc2NyaXB0aW9uO1xuICAgICAgICAgICAgTEFCRUxfVFJFRS52aXNpYmlsaXR5X2lkID0gcGFyc2VJbnQodHJlZS52aXNpYmlsaXR5X2lkKTtcbiAgICAgICAgICAgIGVkaXRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHNhdmluZyA9IGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciB0cmVlRGVsZXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1zZy5zdWNjZXNzKCdUaGUgbGFiZWwgdHJlZSB3YXMgZGVsZXRlZC4gUmVkaXJlY3RpbmcuLi4nKTtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IFJFRElSRUNUX1VSTDtcbiAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgdXNlckxlZnQgPSBmdW5jdGlvbiAocmVkaXJlY3QpIHtcbiAgICAgICAgICAgIGlmIChyZWRpcmVjdCkge1xuICAgICAgICAgICAgICAgIG1zZy5zdWNjZXNzKCdZb3UgbGVmdCB0aGUgbGFiZWwgdHJlZS4gUmVkaXJlY3RpbmcuLi4nKTtcbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gUkVESVJFQ1RfVVJMO1xuICAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbXNnLnN1Y2Nlc3MoJ1lvdSBsZWZ0IHRoZSBsYWJlbCB0cmVlLiBSZWxvYWRpbmcuLi4nKTtcbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzRWRpdGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBlZGl0aW5nO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS50b2dnbGVFZGl0aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZWRpdGluZyA9ICFlZGl0aW5nO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc1NhdmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBzYXZpbmc7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldFZpc2liaWxpdHlJZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBMQUJFTF9UUkVFLnZpc2liaWxpdHlfaWQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldE5hbWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gTEFCRUxfVFJFRS5uYW1lO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5nZXREZXNjcmlwdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBMQUJFTF9UUkVFLmRlc2NyaXB0aW9uO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zYXZlQ2hhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNhdmluZyA9IHRydWU7XG4gICAgICAgICAgICBMYWJlbFRyZWUudXBkYXRlKHtcbiAgICAgICAgICAgICAgICBpZDogTEFCRUxfVFJFRS5pZCxcbiAgICAgICAgICAgICAgICBuYW1lOiAkc2NvcGUubGFiZWxUcmVlSW5mby5uYW1lLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAkc2NvcGUubGFiZWxUcmVlSW5mby5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICB2aXNpYmlsaXR5X2lkOiBwYXJzZUludCgkc2NvcGUubGFiZWxUcmVlSW5mby52aXNpYmlsaXR5X2lkKVxuICAgICAgICAgICAgfSwgaW5mb1VwZGF0ZWQsIGhhbmRsZVNhdmluZ0Vycm9yKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZGlzY2FyZENoYW5nZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUubGFiZWxUcmVlSW5mby5uYW1lID0gTEFCRUxfVFJFRS5uYW1lO1xuICAgICAgICAgICAgJHNjb3BlLmxhYmVsVHJlZUluZm8uZGVzY3JpcHRpb24gPSBMQUJFTF9UUkVFLmRlc2NyaXB0aW9uO1xuICAgICAgICAgICAgJHNjb3BlLmxhYmVsVHJlZUluZm8udmlzaWJpbGl0eV9pZCA9IExBQkVMX1RSRUUudmlzaWJpbGl0eV9pZC50b1N0cmluZygpO1xuICAgICAgICAgICAgZWRpdGluZyA9IGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5kZWxldGVUcmVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpcm0oJ0RvIHlvdSByZWFsbHkgd2FudCB0byBkZWxldGUgdGhlIGxhYmVsIHRyZWUgJyArIExBQkVMX1RSRUUubmFtZSArICc/JykpIHtcbiAgICAgICAgICAgICAgICBMYWJlbFRyZWUuZGVsZXRlKHtpZDogTEFCRUxfVFJFRS5pZH0sIHRyZWVEZWxldGVkLCBtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmxlYXZlVHJlZSA9IGZ1bmN0aW9uIChyZWRpcmVjdCkge1xuICAgICAgICAgICAgLy8gcmVkaXJlY3QgaWYgdGhlIHRyZWUgaXMgcHJpdmF0ZSwgb3RoZXJ3aXNlIHJlbG9hZFxuICAgICAgICAgICAgaWYgKGNvbmZpcm0oJ0RvIHlvdSByZWFsbHkgd2FudCB0byBsZWF2ZSB0aGUgbGFiZWwgdHJlZSAnICsgTEFCRUxfVFJFRS5uYW1lICsgJz8nKSkge1xuICAgICAgICAgICAgICAgIExhYmVsVHJlZVVzZXIuZGV0YWNoKFxuICAgICAgICAgICAgICAgICAgICB7bGFiZWxfdHJlZV9pZDogTEFCRUxfVFJFRS5pZH0sXG4gICAgICAgICAgICAgICAgICAgIHtpZDogVVNFUl9JRH0sXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJMZWZ0KHJlZGlyZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgbXNnLnJlc3BvbnNlRXJyb3JcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgYmlpZ2xlLmxhYmVsLXRyZWVzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgTGFiZWxzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBpbnRlcmFjdGl2ZSBsYWJlbCB0cmVlXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdiaWlnbGUubGFiZWwtdHJlZXMnKS5jb250cm9sbGVyKCdMYWJlbHNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgTEFCRUxTLCBMQUJFTF9UUkVFLCBMYWJlbCwgbXNnLCAkcSkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgZWRpdGluZyA9IGZhbHNlO1xuXG4gICAgICAgIHZhciBsb2FkaW5nID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIHNlbGVjdGVkTGFiZWwgPSBudWxsO1xuXG4gICAgICAgICRzY29wZS50cmVlID0ge307XG5cbiAgICAgICAgLy8gSURzIG9mIGFsbCBsYWJlbHMgdGhhdCBhcmUgY3VycmVudGx5IG9wZW5cbiAgICAgICAgLy8gKGFsbCBwYXJlbnQgbGFiZWxzIG9mIHRoZSBzZWxlY3RlZCBsYWJlbClcbiAgICAgICAgJHNjb3BlLm9wZW5IaWVyYXJjaHkgPSBbXTtcblxuICAgICAgICB2YXIgaGFuZGxlRXJyb3IgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIG1zZy5yZXNwb25zZUVycm9yKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIGxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgYnVpbGRUcmVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnRyZWUgPSB7fTtcbiAgICAgICAgICAgIExBQkVMUy5mb3JFYWNoKGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBsYWJlbC5wYXJlbnRfaWQ7XG4gICAgICAgICAgICAgICAgaWYgKCRzY29wZS50cmVlW3BhcmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnRyZWVbcGFyZW50XS5wdXNoKGxhYmVsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudHJlZVtwYXJlbnRdID0gW2xhYmVsXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaGFuZGxlQ3JlYXRlTGFiZWxTdWNjZXNzID0gZnVuY3Rpb24gKGxhYmVscykge1xuICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoTEFCRUxTLCBsYWJlbHMpO1xuICAgICAgICAgICAgYnVpbGRUcmVlKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnbGFiZWxzLnJlZnJlc2gnKTtcbiAgICAgICAgICAgIGxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgbGFiZWxEZWxldGVkID0gZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gTEFCRUxTLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKExBQkVMU1tpXS5pZCA9PT0gbGFiZWwuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgTEFCRUxTLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnVpbGRUcmVlKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnbGFiZWxzLnJlZnJlc2gnKTtcblxuICAgICAgICAgICAgaWYgKHNlbGVjdGVkTGFiZWwgJiYgc2VsZWN0ZWRMYWJlbC5pZCA9PT0gbGFiZWwuaWQpIHtcbiAgICAgICAgICAgICAgICAvLyBzZWxlY3QgdGhlIHBhcmVudCBpZiB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGxhYmVsIHdhcyBkZWxldGVkXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRMYWJlbCA9IGdldExhYmVsKGxhYmVsLnBhcmVudF9pZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RMYWJlbChzZWxlY3RlZExhYmVsKTtcbiAgICAgICAgICAgIGxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZ2V0TGFiZWwgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBMQUJFTFMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoTEFCRUxTW2ldLmlkID09PSBpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gTEFCRUxTW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHVwZGF0ZU9wZW5IaWVyYXJjaHkgPSBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIHZhciBjdXJyZW50TGFiZWwgPSBsYWJlbDtcbiAgICAgICAgICAgICRzY29wZS5vcGVuSGllcmFyY2h5Lmxlbmd0aCA9IDA7XG5cbiAgICAgICAgICAgIGlmICghY3VycmVudExhYmVsKSByZXR1cm47XG5cbiAgICAgICAgICAgIHdoaWxlIChjdXJyZW50TGFiZWwucGFyZW50X2lkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLm9wZW5IaWVyYXJjaHkudW5zaGlmdChjdXJyZW50TGFiZWwucGFyZW50X2lkKTtcbiAgICAgICAgICAgICAgICBjdXJyZW50TGFiZWwgPSBnZXRMYWJlbChjdXJyZW50TGFiZWwucGFyZW50X2lkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc2VsZWN0TGFiZWwgPSBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkTGFiZWwgPSBsYWJlbDtcbiAgICAgICAgICAgIHVwZGF0ZU9wZW5IaWVyYXJjaHkobGFiZWwpO1xuICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ2xhYmVscy5zZWxlY3RlZCcsIGxhYmVsKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZExhYmVsID0gZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZWN0ZWRMYWJlbCAmJiBzZWxlY3RlZExhYmVsLmlkID09PSBsYWJlbC5pZDtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaGFzTGFiZWxzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIExBQkVMUy5sZW5ndGggPiAwO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc0VkaXRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZWRpdGluZztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUudG9nZ2xlRWRpdGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGVkaXRpbmcgPSAhZWRpdGluZztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0TGFiZWxzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIExBQkVMUztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuY3JlYXRlTGFiZWwgPSBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIC8vIHByZXZlbnQgdXNlcnMgZnJvbSBhY2NpZGVudGFsbHkgYWRkaW5nIGEgbGFiZWwgdHdpY2VcbiAgICAgICAgICAgIGlmIChsb2FkaW5nKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKFtdKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICBsYWJlbC5sYWJlbF90cmVlX2lkID0gTEFCRUxfVFJFRS5pZDtcbiAgICAgICAgICAgIHJldHVybiBMYWJlbC5jcmVhdGUobGFiZWwsIGhhbmRsZUNyZWF0ZUxhYmVsU3VjY2VzcywgaGFuZGxlRXJyb3IpLiRwcm9taXNlO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5yZW1vdmVMYWJlbCA9IGZ1bmN0aW9uIChsYWJlbCwgZSkge1xuICAgICAgICAgICAgbG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgTGFiZWwuZGVsZXRlKHtpZDogbGFiZWwuaWR9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbGFiZWxEZWxldGVkKGxhYmVsKTtcbiAgICAgICAgICAgIH0sIGhhbmRsZUVycm9yKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNMb2FkaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGxvYWRpbmc7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnN0YXJ0TG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxvYWRpbmcgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zdG9wTG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICBidWlsZFRyZWUoKTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIE1hbnVhbExhYmVsc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBiaWlnbGUubGFiZWwtdHJlZXNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciBtYW51YWxseSBhZGRpbmcgbGFiZWxzIHRvIHRoZSBsYWJlbCB0cmVlXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdiaWlnbGUubGFiZWwtdHJlZXMnKS5jb250cm9sbGVyKCdNYW51YWxMYWJlbHNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgcmFuZG9tQ29sb3IpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIERFRkFVTFRTID0ge1xuICAgICAgICAgICAgTEFCRUw6IG51bGwsXG4gICAgICAgICAgICBOQU1FOiAnJ1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zZWxlY3RlZCA9IHtcbiAgICAgICAgICAgIGxhYmVsOiBERUZBVUxUUy5MQUJFTCxcbiAgICAgICAgICAgIGNvbG9yOiByYW5kb21Db2xvci5nZXQoKSxcbiAgICAgICAgICAgIG5hbWU6IERFRkFVTFRTLk5BTUVcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaGFuZGxlTGFiZWxDcmVhdGVTdWNjZXNzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnJlc2V0TmFtZSgpO1xuXG4gICAgICAgICAgICAvLyBkb24ndCByZWZyZXNoIHRoZSBjb2xvciBpZiBuZXcgbGFiZWxzIHNob3VsZCBnZXQgdGhlIHNhbWUgY29sb3IgdGhhbiB0aGVcbiAgICAgICAgICAgIC8vIHNlbGVjdGVkIChwYXJlbnQpIGxhYmVsXG4gICAgICAgICAgICBpZiAoISRzY29wZS5zZWxlY3RlZC5sYWJlbCB8fCAoJyMnICsgJHNjb3BlLnNlbGVjdGVkLmxhYmVsLmNvbG9yKSAhPT0gJHNjb3BlLnNlbGVjdGVkLmNvbG9yKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnJlZnJlc2hDb2xvcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5yZXNldFBhcmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RMYWJlbChERUZBVUxUUy5MQUJFTCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnJlZnJlc2hDb2xvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZC5jb2xvciA9IHJhbmRvbUNvbG9yLmdldCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5yZXNldE5hbWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWQubmFtZSA9IERFRkFVTFRTLk5BTUU7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzTmFtZURpcnR5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5zZWxlY3RlZC5uYW1lICE9PSBERUZBVUxUUy5OQU1FO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc1BhcmVudERpcnR5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5zZWxlY3RlZC5sYWJlbCAhPT0gREVGQVVMVFMuTEFCRUw7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmFkZExhYmVsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGxhYmVsID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6ICRzY29wZS5zZWxlY3RlZC5uYW1lLFxuICAgICAgICAgICAgICAgIGNvbG9yOiAkc2NvcGUuc2VsZWN0ZWQuY29sb3JcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmICgkc2NvcGUuc2VsZWN0ZWQubGFiZWwpIHtcbiAgICAgICAgICAgICAgICBsYWJlbC5wYXJlbnRfaWQgPSAkc2NvcGUuc2VsZWN0ZWQubGFiZWwuaWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICRzY29wZS5jcmVhdGVMYWJlbChsYWJlbCkudGhlbihoYW5kbGVMYWJlbENyZWF0ZVN1Y2Nlc3MpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS4kb24oJ2xhYmVscy5zZWxlY3RlZCcsIGZ1bmN0aW9uIChlLCBsYWJlbCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkLmxhYmVsID0gbGFiZWw7XG4gICAgICAgICAgICBpZiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWQuY29sb3IgPSAnIycgKyBsYWJlbC5jb2xvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBiaWlnbGUubGFiZWwtdHJlZXNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBNZW1iZXJzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSB0aGUgbWVtYmVycyBvZiBhIGxhYmVsIHRyZWVcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2JpaWdsZS5sYWJlbC10cmVlcycpLmNvbnRyb2xsZXIoJ01lbWJlcnNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgTEFCRUxfVFJFRSwgTUVNQkVSUywgUk9MRVMsIERFRkFVTFRfUk9MRV9JRCwgVVNFUl9JRCwgTGFiZWxUcmVlVXNlciwgbXNnLCBVc2VyKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBlZGl0aW5nID0gZmFsc2U7XG4gICAgICAgIHZhciBsb2FkaW5nID0gZmFsc2U7XG5cbiAgICAgICAgJHNjb3BlLm5ld01lbWJlciA9IHtcbiAgICAgICAgICAgIHVzZXI6IG51bGwsXG4gICAgICAgICAgICByb2xlX2lkOiBERUZBVUxUX1JPTEVfSUQudG9TdHJpbmcoKVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBoYW5kbGVFcnJvciA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgbXNnLnJlc3BvbnNlRXJyb3IocmVzcG9uc2UpO1xuICAgICAgICAgICAgbG9hZGluZyA9IGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciByb2xlVXBkYXRlZCA9IGZ1bmN0aW9uIChtZW1iZXIpIHtcbiAgICAgICAgICAgIG1lbWJlci5yb2xlX2lkID0gcGFyc2VJbnQobWVtYmVyLnRtcF9yb2xlX2lkKTtcbiAgICAgICAgICAgIGxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcm9sZVVwZGF0ZUZhaWxlZCA9IGZ1bmN0aW9uIChtZW1iZXIsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBtZW1iZXIudG1wX3JvbGVfaWQgPSBtZW1iZXIucm9sZV9pZC50b1N0cmluZygpO1xuICAgICAgICAgICAgaGFuZGxlRXJyb3IocmVzcG9uc2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBtZW1iZXJSZW1vdmVkID0gZnVuY3Rpb24gKG1lbWJlcikge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IE1FTUJFUlMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoTUVNQkVSU1tpXS5pZCA9PT0gbWVtYmVyLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgIE1FTUJFUlMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHVzZXJJc05vTWVtYmVyID0gZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBNRU1CRVJTLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKE1FTUJFUlNbaV0uaWQgPT09IHVzZXIuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGZpbHRlck1lbWJlcnNGcm9tVXNlcnMgPSBmdW5jdGlvbiAodXNlcnMpIHtcbiAgICAgICAgICAgIHJldHVybiB1c2Vycy5maWx0ZXIodXNlcklzTm9NZW1iZXIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBtZW1iZXJBdHRhY2hlZCA9IGZ1bmN0aW9uIChtZW1iZXIpIHtcbiAgICAgICAgICAgIG1lbWJlci50bXBfcm9sZV9pZCA9IG1lbWJlci5yb2xlX2lkLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBNRU1CRVJTLnB1c2gobWVtYmVyKTtcbiAgICAgICAgICAgICRzY29wZS5uZXdNZW1iZXIudXNlciA9IG51bGw7XG4gICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzRWRpdGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBlZGl0aW5nO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS50b2dnbGVFZGl0aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZWRpdGluZyA9ICFlZGl0aW5nO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc0xvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9hZGluZztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0TWVtYmVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBNRU1CRVJTO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5oYXNNZW1iZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIE1FTUJFUlMubGVuZ3RoID4gMDtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0Um9sZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gUk9MRVM7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldFJvbGUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBST0xFU1tpZF07XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzT3duVXNlciA9IGZ1bmN0aW9uIChtZW1iZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBVU0VSX0lEID09PSBtZW1iZXIuaWQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnVwZGF0ZVJvbGUgPSBmdW5jdGlvbiAobWVtYmVyKSB7XG4gICAgICAgICAgICBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIExhYmVsVHJlZVVzZXIudXBkYXRlKFxuICAgICAgICAgICAgICAgIHtsYWJlbF90cmVlX2lkOiBMQUJFTF9UUkVFLmlkfSxcbiAgICAgICAgICAgICAgICB7aWQ6IG1lbWJlci5pZCwgcm9sZV9pZDogcGFyc2VJbnQobWVtYmVyLnRtcF9yb2xlX2lkKX0sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByb2xlVXBkYXRlZChtZW1iZXIpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJvbGVVcGRhdGVGYWlsZWQobWVtYmVyLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZGV0YWNoTWVtYmVyID0gZnVuY3Rpb24gKG1lbWJlcikge1xuICAgICAgICAgICAgbG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICBMYWJlbFRyZWVVc2VyLmRldGFjaChcbiAgICAgICAgICAgICAgICB7bGFiZWxfdHJlZV9pZDogTEFCRUxfVFJFRS5pZH0sXG4gICAgICAgICAgICAgICAge2lkOiBtZW1iZXIuaWR9LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVtYmVyUmVtb3ZlZChtZW1iZXIpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaGFuZGxlRXJyb3JcbiAgICAgICAgICAgICk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnVzZXJuYW1lID0gZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIGlmICh1c2VyICYmIHVzZXIuZmlyc3RuYW1lICYmIHVzZXIubGFzdG5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXNlci5maXJzdG5hbWUgKyAnICcgKyB1c2VyLmxhc3RuYW1lO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmZpbmRVc2VyID0gZnVuY3Rpb24gKHF1ZXJ5KSB7XG4gICAgICAgICAgICByZXR1cm4gVXNlci5maW5kKHtxdWVyeTogZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5KX0pLiRwcm9taXNlXG4gICAgICAgICAgICAgICAgLnRoZW4oZmlsdGVyTWVtYmVyc0Zyb21Vc2Vycyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLm5ld01lbWJlclZhbGlkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5uZXdNZW1iZXIudXNlciAmJlxuICAgICAgICAgICAgICAgICRzY29wZS5uZXdNZW1iZXIudXNlci5pZCAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICAgICAgdXNlcklzTm9NZW1iZXIoJHNjb3BlLm5ld01lbWJlci51c2VyKSAmJlxuICAgICAgICAgICAgICAgICRzY29wZS5uZXdNZW1iZXIucm9sZV9pZCAhPT0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuYXR0YWNoTWVtYmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCEkc2NvcGUubmV3TWVtYmVyVmFsaWQoKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhciBtZW1iZXIgPSAkc2NvcGUubmV3TWVtYmVyLnVzZXI7XG4gICAgICAgICAgICAvLyBvdmVyd3JpdGUgZ2xvYmFsIHJvbGVfaWQgcmV0dXJuZWQgZnJvbSBVc2VyLmZpbmQoKSB3aXRoIGxhYmVsIHRyZWUgcm9sZV9pZFxuICAgICAgICAgICAgbWVtYmVyLnJvbGVfaWQgPSBwYXJzZUludCgkc2NvcGUubmV3TWVtYmVyLnJvbGVfaWQpO1xuXG4gICAgICAgICAgICBMYWJlbFRyZWVVc2VyLmF0dGFjaChcbiAgICAgICAgICAgICAgICB7bGFiZWxfdHJlZV9pZDogTEFCRUxfVFJFRS5pZH0sXG4gICAgICAgICAgICAgICAge2lkOiBtZW1iZXIuaWQsIHJvbGVfaWQ6IG1lbWJlci5yb2xlX2lkfSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lbWJlckF0dGFjaGVkKG1lbWJlcik7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBoYW5kbGVFcnJvclxuICAgICAgICAgICAgKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBjb252ZXJ0IHJvbGUgSURzIHRvIHN0cmluZyBzbyB0aGV5IGNhbiBiZSBzZWxlY3RlZCBpbiBhIHNlbGVjdCBpbnB1dCBmaWVsZFxuICAgICAgICAvLyBhbHNvIGFkZCBpdCBhcyB0bXBfcm9sZV9pZCBzbyB0aGUgSUQgY2FuIGJlIHJlc2V0IGlmIHRoZSBjaGFuZ2UgZmFpbGVkXG4gICAgICAgIGZvciAodmFyIGkgPSBNRU1CRVJTLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBNRU1CRVJTW2ldLnRtcF9yb2xlX2lkID0gTUVNQkVSU1tpXS5yb2xlX2lkLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFdvcm1zTGFiZWxzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIGltcG9ydGluZyBsYWJlbHMgZnJvbSBXb1JNU1xuICovXG5hbmd1bGFyLm1vZHVsZSgnYmlpZ2xlLmxhYmVsLXRyZWVzJykuY29udHJvbGxlcignV29ybXNMYWJlbHNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgTGFiZWxTb3VyY2UsIExBQkVMX1NPVVJDRVMsIG1zZywgcmFuZG9tQ29sb3IpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgLy8gV29STVMgbGFiZWwgc291cmNlXG4gICAgICAgIHZhciBzb3VyY2UgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IExBQkVMX1NPVVJDRVMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoTEFCRUxfU09VUkNFU1tpXS5uYW1lID09PSAnd29ybXMnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBMQUJFTF9TT1VSQ0VTW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkoKTtcblxuICAgICAgICB2YXIgREVGQVVMVFMgPSB7XG4gICAgICAgICAgICBMQUJFTDogbnVsbCxcbiAgICAgICAgICAgIE5BTUU6ICcnXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGZpbmRSZXN1bHRzID0gW107XG4gICAgICAgIC8vIGlzIHRoZSBzZWFyY2ggcXVlcnkgY3VycmVudGx5IGJlaW5nIHByb2Nlc3NlZD9cbiAgICAgICAgdmFyIGZpbmRpbmcgPSBmYWxzZTtcblxuICAgICAgICAvLyBpcyB0aGUgcmVjdXJzaXZlIG9wdGlvbiBhY3RpdmF0ZWQ/XG4gICAgICAgIHZhciByZWN1cnNpdmUgPSBmYWxzZTtcblxuICAgICAgICAvLyBzb3VyY2VfaWQgb2YgYWxsIGxhYmVscyB0aGF0IHdlcmUgaW1wb3J0ZWQgaW4gdGhpcyBzZXNzaW9uXG4gICAgICAgIHZhciBpbXBvcnRlZElkcyA9IFtdO1xuXG4gICAgICAgIHZhciBoYW5kbGVGaW5kRXJyb3IgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGZpbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICRzY29wZS5zdG9wTG9hZGluZygpO1xuICAgICAgICAgICAgbXNnLnJlc3BvbnNlRXJyb3IocmVzcG9uc2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBoYW5kbGVGaW5kU3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZpbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICRzY29wZS5zdG9wTG9hZGluZygpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBhZGRJbXBvcnRlZElkcyA9IGZ1bmN0aW9uIChsYWJlbHMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBsYWJlbHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBpbXBvcnRlZElkcy5wdXNoKHBhcnNlSW50KGxhYmVsc1tpXS5zb3VyY2VfaWQpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZG9uJ3QgcmVmcmVzaCB0aGUgY29sb3IgaWYgbmV3IGxhYmVscyBzaG91bGQgZ2V0IHRoZSBzYW1lIGNvbG9yIHRoYW4gdGhlXG4gICAgICAgICAgICAvLyBzZWxlY3RlZCAocGFyZW50KSBsYWJlbFxuICAgICAgICAgICAgaWYgKCEkc2NvcGUuc2VsZWN0ZWQubGFiZWwgfHwgKCcjJyArICRzY29wZS5zZWxlY3RlZC5sYWJlbC5jb2xvcikgIT09ICRzY29wZS5zZWxlY3RlZC5jb2xvcikge1xuICAgICAgICAgICAgICAgICRzY29wZS5yZWZyZXNoQ29sb3IoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc2VsZWN0ZWQgPSB7XG4gICAgICAgICAgICBsYWJlbDogREVGQVVMVFMuTEFCRUwsXG4gICAgICAgICAgICBjb2xvcjogcmFuZG9tQ29sb3IuZ2V0KCksXG4gICAgICAgICAgICBuYW1lOiBERUZBVUxUUy5OQU1FXG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldEZpbmRSZXN1bHRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGZpbmRSZXN1bHRzO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc0ZpbmRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmluZGluZztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaGFzRmluZFJlc3VsdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmluZFJlc3VsdHMubGVuZ3RoID4gMDtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZmluZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZpbmRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgJHNjb3BlLnN0YXJ0TG9hZGluZygpO1xuICAgICAgICAgICAgZmluZFJlc3VsdHMgPSBMYWJlbFNvdXJjZS5xdWVyeShcbiAgICAgICAgICAgICAgICB7aWQ6IHNvdXJjZS5pZCwgcXVlcnk6ICRzY29wZS5zZWxlY3RlZC5uYW1lfSxcbiAgICAgICAgICAgICAgICBoYW5kbGVGaW5kU3VjY2VzcyxcbiAgICAgICAgICAgICAgICBoYW5kbGVGaW5kRXJyb3JcbiAgICAgICAgICAgICk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldENsYXNzaWZpY2F0aW9uID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLnBhcmVudHMuam9pbignID4gJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnJlc2V0UGFyZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdExhYmVsKERFRkFVTFRTLkxBQkVMKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUucmVmcmVzaENvbG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkLmNvbG9yID0gcmFuZG9tQ29sb3IuZ2V0KCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzTmFtZURpcnR5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5zZWxlY3RlZC5uYW1lICE9PSBERUZBVUxUUy5OQU1FO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc1BhcmVudERpcnR5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5zZWxlY3RlZC5sYWJlbCAhPT0gREVGQVVMVFMuTEFCRUw7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnRvZ2dsZVJlY3Vyc2l2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJlY3Vyc2l2ZSA9ICFyZWN1cnNpdmU7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzUmVjdXJzaXZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlY3Vyc2l2ZTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuYWRkTGFiZWwgPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgdmFyIGxhYmVsID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6IGl0ZW0ubmFtZSxcbiAgICAgICAgICAgICAgICBjb2xvcjogJHNjb3BlLnNlbGVjdGVkLmNvbG9yLFxuICAgICAgICAgICAgICAgIHNvdXJjZV9pZDogaXRlbS5hcGhpYV9pZCxcbiAgICAgICAgICAgICAgICBsYWJlbF9zb3VyY2VfaWQ6IHNvdXJjZS5pZFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKHJlY3Vyc2l2ZSkge1xuICAgICAgICAgICAgICAgIGxhYmVsLnJlY3Vyc2l2ZSA9ICd0cnVlJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoJHNjb3BlLnNlbGVjdGVkLmxhYmVsKSB7XG4gICAgICAgICAgICAgICAgbGFiZWwucGFyZW50X2lkID0gJHNjb3BlLnNlbGVjdGVkLmxhYmVsLmlkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAkc2NvcGUuY3JlYXRlTGFiZWwobGFiZWwpLnRoZW4oYWRkSW1wb3J0ZWRJZHMpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5nZXRBZGRCdXR0b25UaXRsZSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICBpZiAoJHNjb3BlLmlzUmVjdXJzaXZlKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ0FkZCAnICsgaXRlbS5uYW1lICsgJyBhbmQgYWxsIFdvUk1TIHBhcmVudHMgYXMgbmV3IGxhYmVscyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICgkc2NvcGUuaXNQYXJlbnREaXJ0eSgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdBZGQgJyArIGl0ZW0ubmFtZSArICcgYXMgYSBjaGlsZCBvZiAnICsgJHNjb3BlLnNlbGVjdGVkLmxhYmVsLm5hbWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAnQWRkICcgKyBpdGVtLm5hbWUgKyAnIGFzIGEgcm9vdCBsYWJlbCc7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmhhc0JlZW5JbXBvcnRlZCA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gaW1wb3J0ZWRJZHMuaW5kZXhPZihpdGVtLmFwaGlhX2lkKSAhPT0gLTE7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLiRvbignbGFiZWxzLnNlbGVjdGVkJywgZnVuY3Rpb24gKGUsIGxhYmVsKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWQubGFiZWwgPSBsYWJlbDtcbiAgICAgICAgICAgIGlmIChsYWJlbCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZC5jb2xvciA9ICcjJyArIGxhYmVsLmNvbG9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgbGFiZWxUcmVlSXRlbVxuICogQG1lbWJlck9mIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQGRlc2NyaXB0aW9uIEEgbGFiZWwgdHJlZSBpdGVtLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnYmlpZ2xlLmxhYmVsLXRyZWVzJykuZGlyZWN0aXZlKCdsYWJlbFRyZWVJdGVtJywgZnVuY3Rpb24gKCRjb21waWxlLCAkdGltZW91dCwgJHRlbXBsYXRlQ2FjaGUpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQycsXG5cbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnbGFiZWwtaXRlbS5odG1sJyxcblxuICAgICAgICAgICAgc2NvcGU6IHRydWUsXG5cbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAvLyB3YWl0IGZvciB0aGlzIGVsZW1lbnQgdG8gYmUgcmVuZGVyZWQgdW50aWwgdGhlIGNoaWxkcmVuIGFyZVxuICAgICAgICAgICAgICAgIC8vIGFwcGVuZGVkLCBvdGhlcndpc2UgdGhlcmUgd291bGQgYmUgdG9vIG11Y2ggcmVjdXJzaW9uIGZvclxuICAgICAgICAgICAgICAgIC8vIGFuZ3VsYXJcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IGFuZ3VsYXIuZWxlbWVudCgkdGVtcGxhdGVDYWNoZS5nZXQoJ2xhYmVsLXN1YnRyZWUuaHRtbCcpKTtcbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kKCRjb21waWxlKGNvbnRlbnQpKHNjb3BlKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgLy8gb3BlbiB0aGUgc3VidHJlZSBvZiB0aGlzIGl0ZW1cbiAgICAgICAgICAgICAgICB2YXIgb3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXRlbSBoYXMgY2hpbGRyZW5cbiAgICAgICAgICAgICAgICB2YXIgZXhwYW5kYWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXRlbSBpcyBjdXJyZW50bHkgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICB2YXIgc2VsZWN0ZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIHZhciBjaGVja1N0YXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLm9wZW5IaWVyYXJjaHkuaW5kZXhPZigkc2NvcGUuaXRlbS5pZCkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoJHNjb3BlLmlzU2VsZWN0ZWRMYWJlbCgkc2NvcGUuaXRlbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB2YXIgY2hlY2tFeHBhbmRhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBleHBhbmRhYmxlID0gJHNjb3BlLnRyZWUgJiYgJHNjb3BlLnRyZWUuaGFzT3duUHJvcGVydHkoJHNjb3BlLml0ZW0uaWQpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAkc2NvcGUuZ2V0U3VidHJlZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkc2NvcGUudHJlZVskc2NvcGUuaXRlbS5pZF07XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgfTtcblxuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmdldENsYXNzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3Blbjogb3BlbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cGFuZGFibGU6IGV4cGFuZGFibGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZDogc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignbGFiZWxzLnNlbGVjdGVkJywgY2hlY2tTdGF0ZSk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignbGFiZWxzLnJlZnJlc2gnLCBjaGVja0V4cGFuZGFibGUpO1xuICAgICAgICAgICAgICAgIGNoZWNrU3RhdGUoKTtcbiAgICAgICAgICAgICAgICBjaGVja0V4cGFuZGFibGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGJpaWdsZS5hdGVcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSByYW5jb21Db2xvclxuICogQG1lbWJlck9mIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQGRlc2NyaXB0aW9uIFByb3ZpZGVzIGEgbWFjaGFuaXNtIGZvciByYW5kb20gY29sb3JzXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdiaWlnbGUubGFiZWwtdHJlZXMnKS5zZXJ2aWNlKCdyYW5kb21Db2xvcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgLy8gSFNWIHZhbHVlc1xuICAgICAgICB2YXIgTUlOID0gWzAsIDAuNSwgMC45XTtcbiAgICAgICAgdmFyIE1BWCA9IFszNjAsIDEsIDFdO1xuXG4gICAgICAgIC8vIG51bWJlciBvZiBkZWNpbWFscyB0byBrZWVwXG4gICAgICAgIHZhciBQUkVDSVNJT04gPSBbMCwgMiwgMl07XG5cbiAgICAgICAgLy8gc2VlIGh0dHBzOi8vZGUud2lraXBlZGlhLm9yZy93aWtpL0hTVi1GYXJicmF1bSNUcmFuc2Zvcm1hdGlvbl92b25fUkdCX3VuZF9IU1YuMkZIU0xcbiAgICAgICAgdmFyIHRvUmdiID0gZnVuY3Rpb24gKGhzdikge1xuXG4gICAgICAgICAgICB2YXIgdG1wID0gaHN2WzBdIC8gNjA7XG4gICAgICAgICAgICB2YXIgaGkgPSBNYXRoLmZsb29yKHRtcCk7XG4gICAgICAgICAgICB2YXIgZiA9IHRtcCAtIGhpO1xuICAgICAgICAgICAgdmFyIHBxdCA9IFtcbiAgICAgICAgICAgICAgICBoc3ZbMl0gKiAoMSAtIGhzdlsxXSksXG4gICAgICAgICAgICAgICAgaHN2WzJdICogKDEgLSBoc3ZbMV0gKiBmKSxcbiAgICAgICAgICAgICAgICBoc3ZbMl0gKiAoMSAtIGhzdlsxXSAqICgxIC0gZikpXG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICB2YXIgcmdiO1xuXG4gICAgICAgICAgICBzd2l0Y2ggKGhpKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgICAgICByZ2IgPSBbcHF0WzFdLCBoc3ZbMl0sIHBxdFswXV07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgICAgcmdiID0gW3BxdFswXSwgaHN2WzJdLCBwcXRbMl1dO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgICAgIHJnYiA9IFtwcXRbMF0sIHBxdFsxXSwgaHN2WzJdXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgICAgICByZ2IgPSBbcHF0WzJdLCBwcXRbMF0sIGhzdlsyXV07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgNTpcbiAgICAgICAgICAgICAgICAgICAgcmdiID0gW2hzdlsyXSwgcHF0WzBdLCBwcXRbMV1dO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICByZ2IgPSBbaHN2WzJdLCBwcXRbMl0sIHBxdFswXV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZ2IubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChpdGVtICogMjU1KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciB0b0hleCA9IGZ1bmN0aW9uIChyZ2IpIHtcbiAgICAgICAgICAgIHJldHVybiByZ2IubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgaXRlbSA9IGl0ZW0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgIHJldHVybiAoaXRlbS5sZW5ndGggPT09IDEpID8gKCcwJyArIGl0ZW0pIDogaXRlbTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNvbG9yID0gWzAsIDAsIDBdO1xuICAgICAgICAgICAgdmFyIHByZWNpc2lvbjtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBjb2xvci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIHByZWNpc2lvbiA9IDEwICogUFJFQ0lTSU9OW2ldO1xuICAgICAgICAgICAgICAgIGNvbG9yW2ldID0gKE1BWFtpXSAtIE1JTltpXSkgKiBNYXRoLnJhbmRvbSgpICsgTUlOW2ldO1xuICAgICAgICAgICAgICAgIGlmIChwcmVjaXNpb24gIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29sb3JbaV0gPSBNYXRoLnJvdW5kKGNvbG9yW2ldICogcHJlY2lzaW9uKSAvIHByZWNpc2lvbjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb2xvcltpXSA9IE1hdGgucm91bmQoY29sb3JbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICcjJyArIHRvSGV4KHRvUmdiKGNvbG9yKSkuam9pbignJyk7XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
