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
 * A component that displays a list of label trees.
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.labelTrees', {
    template: '<div class="label-trees">' +
        '<div v-if="typeahead || clearable" class="label-trees__head">' +
            '<button v-if="clearable" @click="clear" class="btn btn-default" title="Clear selected labels"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>' +
            '<label-typeahead v-if="typeahead" :labels="labels" @select="handleSelect"></label-typeahead>' +
        '</div>' +
        '<div class="label-trees__body">' +
            '<label-tree :name="tree.name" :labels="tree.labels" :multiselect="multiselect" v-for="tree in trees" @select="handleSelect" @deselect="handleDeselect"></label-tree>' +
        '</div>' +
    '</div>',
    components: {
        labelTypeahead: biigle.$require('labelTrees.components.labelTypeahead'),
        labelTree: biigle.$require('labelTrees.components.labelTree'),
    },
    props: {
        trees: {
            type: Array,
            required: true,
        },
        typeahead: {
            type: Boolean,
            default: true,
        },
        clearable: {
            type: Boolean,
            default: true,
        },
        multiselect: {
            type: Boolean,
            default: false,
        }
    },
    computed: {
        // All labels of all label trees in a flat list.
        labels: function () {
            var labels = [];
            for (var i = this.trees.length - 1; i >= 0; i--) {
                Array.prototype.push.apply(labels, this.trees[i].labels);
            }

            return labels;
        }
    },
    methods: {
        handleSelect: function (label) {
            this.$emit('select', label);
        },
        handleDeselect: function (label) {
            this.$emit('deselect', label);
        },
        clear: function () {
            this.$emit('clear');
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxhYmVsLXRyZWVzL21haW4uanMiLCJ2dWUvbGFiZWxUcmVlc0xhYmVscy5qcyIsInZ1ZS9yYW5kb21Db2xvci5qcyIsImxhYmVsLXRyZWVzL2NvbnRyb2xsZXJzL0F1dGhvcml6ZWRQcm9qZWN0c0NvbnRyb2xsZXIuanMiLCJsYWJlbC10cmVlcy9jb250cm9sbGVycy9MYWJlbFRyZWVDb250cm9sbGVyLmpzIiwibGFiZWwtdHJlZXMvY29udHJvbGxlcnMvTWVtYmVyc0NvbnRyb2xsZXIuanMiLCJ2dWUvYXBpL2xhYmVsU291cmNlLmpzIiwidnVlL2FwaS9sYWJlbHMuanMiLCJ2dWUvY29tcG9uZW50cy9sYWJlbFRyZWUuanMiLCJ2dWUvY29tcG9uZW50cy9sYWJlbFRyZWVMYWJlbC5qcyIsInZ1ZS9jb21wb25lbnRzL2xhYmVsVHJlZXMuanMiLCJ2dWUvY29tcG9uZW50cy9sYWJlbFR5cGVhaGVhZC5qcyIsInZ1ZS9jb21wb25lbnRzL21hbnVhbExhYmVsRm9ybS5qcyIsInZ1ZS9jb21wb25lbnRzL3dvcm1zTGFiZWxGb3JtLmpzIiwidnVlL2NvbXBvbmVudHMvd29ybXNSZXN1bHRJdGVtLmpzIiwidnVlL21peGlucy9sYWJlbEZvcm1Db21wb25lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFJQSxRQUFBLE9BQUEsc0JBQUEsQ0FBQSxjQUFBOzs7Ozs7QUFNQSxRQUFBLE9BQUEsc0JBQUEsNEJBQUEsVUFBQSxrQkFBQTtJQUNBOztJQUVBLGlCQUFBLGlCQUFBOzs7Ozs7QUNWQSxPQUFBLFdBQUEsc0JBQUEsVUFBQSxTQUFBO0lBQ0EsSUFBQSxTQUFBLE9BQUEsU0FBQTtJQUNBLElBQUEsV0FBQSxPQUFBLFNBQUE7SUFDQSxJQUFBLGNBQUEsT0FBQSxTQUFBO0lBQ0EsSUFBQSxZQUFBLE9BQUEsU0FBQTs7SUFFQSxJQUFBLElBQUE7UUFDQSxJQUFBO1FBQ0EsTUFBQTtZQUNBLFNBQUE7WUFDQSxTQUFBO1lBQ0EsUUFBQSxPQUFBLFNBQUE7WUFDQSxlQUFBO1lBQ0EsZUFBQTtZQUNBLGNBQUE7O1FBRUEsWUFBQTtZQUNBLFdBQUEsU0FBQTtZQUNBLE1BQUEsU0FBQTtZQUNBLEtBQUEsU0FBQTtZQUNBLFdBQUEsT0FBQSxTQUFBO1lBQ0EsaUJBQUEsT0FBQSxTQUFBO1lBQ0EsZ0JBQUEsT0FBQSxTQUFBOztRQUVBLFVBQUE7WUFDQSxhQUFBLFlBQUE7Z0JBQ0EsT0FBQTtvQkFDQSxpQkFBQSxLQUFBOzs7O1FBSUEsU0FBQTtZQUNBLGVBQUEsWUFBQTtnQkFDQSxLQUFBLFVBQUEsQ0FBQSxLQUFBOztZQUVBLGNBQUEsWUFBQTtnQkFDQSxLQUFBLFVBQUE7O1lBRUEsZUFBQSxZQUFBO2dCQUNBLEtBQUEsVUFBQTs7WUFFQSxhQUFBLFVBQUEsT0FBQTtnQkFDQSxJQUFBLE9BQUE7Z0JBQ0EsS0FBQTtnQkFDQSxPQUFBLE9BQUEsQ0FBQSxJQUFBLE1BQUE7cUJBQ0EsS0FBQSxZQUFBO3dCQUNBLEtBQUEsYUFBQTt1QkFDQSxTQUFBO3FCQUNBLFFBQUEsS0FBQTs7WUFFQSxjQUFBLFVBQUEsT0FBQTtnQkFDQSxJQUFBLEtBQUEsaUJBQUEsS0FBQSxjQUFBLE9BQUEsTUFBQSxJQUFBO29CQUNBLEtBQUEsY0FBQTs7O2dCQUdBLEtBQUEsSUFBQSxJQUFBLEtBQUEsT0FBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7b0JBQ0EsSUFBQSxLQUFBLE9BQUEsR0FBQSxPQUFBLE1BQUEsSUFBQTt3QkFDQSxLQUFBLE9BQUEsT0FBQSxHQUFBO3dCQUNBOzs7O1lBSUEsYUFBQSxVQUFBLE9BQUE7Z0JBQ0EsS0FBQSxnQkFBQTtnQkFDQSxJQUFBLENBQUEsT0FBQTtvQkFDQSxLQUFBLE1BQUE7dUJBQ0E7b0JBQ0EsS0FBQSxnQkFBQSxNQUFBLE1BQUE7b0JBQ0EsS0FBQSxNQUFBLFVBQUE7OztZQUdBLGVBQUEsVUFBQSxPQUFBO2dCQUNBLEtBQUEsZ0JBQUE7Z0JBQ0EsS0FBQSxNQUFBLFlBQUE7O1lBRUEsYUFBQSxVQUFBLE9BQUE7Z0JBQ0EsS0FBQSxnQkFBQTs7WUFFQSxZQUFBLFVBQUEsTUFBQTtnQkFDQSxLQUFBLGVBQUE7O1lBRUEsYUFBQSxVQUFBLE9BQUE7Z0JBQ0EsSUFBQSxJQUFBLE9BQUEsUUFBQTtnQkFDQSxJQUFBLElBQUEsT0FBQSxZQUFBO2dCQUNBLElBQUEsT0FBQSxNQUFBLEtBQUE7O2dCQUVBLEtBQUEsSUFBQSxJQUFBLEdBQUEsU0FBQSxLQUFBLE9BQUEsUUFBQSxJQUFBLFFBQUEsS0FBQTtvQkFDQSxJQUFBLEtBQUEsT0FBQSxHQUFBLEtBQUEsaUJBQUEsTUFBQTt3QkFDQSxLQUFBLE9BQUEsT0FBQSxHQUFBLEdBQUE7d0JBQ0E7Ozs7O2dCQUtBLEtBQUEsT0FBQSxLQUFBOztZQUVBLGFBQUEsVUFBQSxPQUFBO2dCQUNBLElBQUEsS0FBQSxTQUFBO29CQUNBOzs7Z0JBR0EsS0FBQTtnQkFDQSxPQUFBLEtBQUEsQ0FBQSxlQUFBLFVBQUEsS0FBQTtxQkFDQSxLQUFBLEtBQUEsY0FBQSxTQUFBO3FCQUNBLFFBQUEsS0FBQTs7WUFFQSxjQUFBLFVBQUEsVUFBQTtnQkFDQSxTQUFBLEtBQUEsUUFBQSxLQUFBO2dCQUNBLEtBQUEsZ0JBQUE7Z0JBQ0EsS0FBQSxlQUFBOzs7Ozs7Ozs7QUM3R0EsT0FBQSxTQUFBLDBCQUFBLFlBQUE7O0lBRUEsSUFBQSxNQUFBLENBQUEsR0FBQSxLQUFBO0lBQ0EsSUFBQSxNQUFBLENBQUEsS0FBQSxHQUFBOzs7SUFHQSxJQUFBLFlBQUEsQ0FBQSxHQUFBLEdBQUE7OztJQUdBLElBQUEsUUFBQSxVQUFBLEtBQUE7UUFDQSxJQUFBLE1BQUEsSUFBQSxLQUFBO1FBQ0EsSUFBQSxLQUFBLEtBQUEsTUFBQTtRQUNBLElBQUEsSUFBQSxNQUFBO1FBQ0EsSUFBQSxNQUFBO1lBQ0EsSUFBQSxNQUFBLElBQUEsSUFBQTtZQUNBLElBQUEsTUFBQSxJQUFBLElBQUEsS0FBQTtZQUNBLElBQUEsTUFBQSxJQUFBLElBQUEsTUFBQSxJQUFBOzs7UUFHQSxJQUFBOztRQUVBLFFBQUE7WUFDQSxLQUFBO2dCQUNBLE1BQUEsQ0FBQSxJQUFBLElBQUEsSUFBQSxJQUFBLElBQUE7Z0JBQ0E7WUFDQSxLQUFBO2dCQUNBLE1BQUEsQ0FBQSxJQUFBLElBQUEsSUFBQSxJQUFBLElBQUE7Z0JBQ0E7WUFDQSxLQUFBO2dCQUNBLE1BQUEsQ0FBQSxJQUFBLElBQUEsSUFBQSxJQUFBLElBQUE7Z0JBQ0E7WUFDQSxLQUFBO2dCQUNBLE1BQUEsQ0FBQSxJQUFBLElBQUEsSUFBQSxJQUFBLElBQUE7Z0JBQ0E7WUFDQSxLQUFBO2dCQUNBLE1BQUEsQ0FBQSxJQUFBLElBQUEsSUFBQSxJQUFBLElBQUE7Z0JBQ0E7WUFDQTtnQkFDQSxNQUFBLENBQUEsSUFBQSxJQUFBLElBQUEsSUFBQSxJQUFBOzs7UUFHQSxPQUFBLElBQUEsSUFBQSxTQUFBLE1BQUE7WUFDQSxPQUFBLEtBQUEsTUFBQSxPQUFBOzs7O0lBSUEsSUFBQSxRQUFBLFVBQUEsS0FBQTtRQUNBLE9BQUEsSUFBQSxJQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUEsS0FBQSxTQUFBO1lBQ0EsT0FBQSxDQUFBLEtBQUEsV0FBQSxNQUFBLE1BQUEsUUFBQTs7OztJQUlBLE9BQUEsWUFBQTtRQUNBLElBQUEsUUFBQSxDQUFBLEdBQUEsR0FBQTtRQUNBLElBQUE7UUFDQSxLQUFBLElBQUEsSUFBQSxNQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtZQUNBLFlBQUEsS0FBQSxVQUFBO1lBQ0EsTUFBQSxLQUFBLENBQUEsSUFBQSxLQUFBLElBQUEsTUFBQSxLQUFBLFdBQUEsSUFBQTtZQUNBLElBQUEsY0FBQSxHQUFBO2dCQUNBLE1BQUEsS0FBQSxLQUFBLE1BQUEsTUFBQSxLQUFBLGFBQUE7bUJBQ0E7Z0JBQ0EsTUFBQSxLQUFBLEtBQUEsTUFBQSxNQUFBOzs7O1FBSUEsT0FBQSxNQUFBLE1BQUEsTUFBQSxRQUFBLEtBQUE7Ozs7Ozs7Ozs7O0FDOURBLFFBQUEsT0FBQSxzQkFBQSxXQUFBLHdJQUFBLFVBQUEsUUFBQSxZQUFBLGVBQUEsbUJBQUEsU0FBQSw0QkFBQTtRQUNBOztRQUVBLElBQUEsVUFBQTtRQUNBLElBQUEsVUFBQTs7UUFFQSxJQUFBLGNBQUE7OztRQUdBLElBQUEsMkJBQUE7O1FBRUEsSUFBQSx5QkFBQSxVQUFBLFNBQUE7WUFDQSxLQUFBLElBQUEsSUFBQSxjQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtnQkFDQSxJQUFBLGNBQUEsR0FBQSxPQUFBLFFBQUEsSUFBQTtvQkFDQSxPQUFBOzs7O1lBSUEsT0FBQTs7O1FBR0EsSUFBQSxpQ0FBQSxVQUFBLFVBQUE7WUFDQSwyQkFBQSxTQUFBLE9BQUE7OztRQUdBLElBQUEsY0FBQSxVQUFBLFVBQUE7WUFDQSxJQUFBLGNBQUE7WUFDQSxVQUFBOzs7UUFHQSxJQUFBLGVBQUEsVUFBQSxTQUFBO1lBQ0EsY0FBQSxLQUFBOztZQUVBLGtCQUFBLEtBQUEsUUFBQTtZQUNBLCtCQUFBO1lBQ0EsVUFBQTs7O1FBR0EsSUFBQSxpQkFBQSxVQUFBLFNBQUE7WUFDQSxJQUFBO1lBQ0EsS0FBQSxJQUFBLGNBQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO2dCQUNBLElBQUEsY0FBQSxHQUFBLE9BQUEsUUFBQSxJQUFBO29CQUNBLGNBQUEsT0FBQSxHQUFBO29CQUNBOzs7O1lBSUEsSUFBQSxrQkFBQSxRQUFBLFFBQUE7WUFDQSxJQUFBLE1BQUEsQ0FBQSxHQUFBO2dCQUNBLGtCQUFBLE9BQUEsR0FBQTs7O1lBR0EsK0JBQUE7WUFDQSxVQUFBOzs7UUFHQSxPQUFBLGNBQUEsWUFBQTtZQUNBLE9BQUEsY0FBQSxTQUFBOzs7UUFHQSxPQUFBLGNBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLE9BQUEsZUFBQSxVQUFBLFNBQUE7WUFDQSxPQUFBLGtCQUFBLFFBQUEsUUFBQSxRQUFBLENBQUE7OztRQUdBLE9BQUEsWUFBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsT0FBQSxrQkFBQSxZQUFBO1lBQ0EsT0FBQSxXQUFBOzs7UUFHQSxPQUFBLGdCQUFBLFlBQUE7WUFDQSxJQUFBLENBQUEsYUFBQTtnQkFDQSxjQUFBLFFBQUEsTUFBQTs7O1lBR0EsVUFBQSxDQUFBOzs7UUFHQSxPQUFBLFlBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLE9BQUEsOEJBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLE9BQUEsdUJBQUEsVUFBQSxTQUFBO1lBQ0EsVUFBQTtZQUNBLDJCQUFBO2dCQUNBLENBQUEsSUFBQSxXQUFBO2dCQUNBLENBQUEsSUFBQSxRQUFBO2dCQUNBLFlBQUE7b0JBQ0EsYUFBQTs7Z0JBRUE7Ozs7UUFJQSxPQUFBLDBCQUFBLFVBQUEsU0FBQTtZQUNBLFVBQUE7WUFDQSwyQkFBQTtnQkFDQSxDQUFBLElBQUEsV0FBQTtnQkFDQSxDQUFBLElBQUEsUUFBQTtnQkFDQSxZQUFBO29CQUNBLGVBQUE7O2dCQUVBOzs7Ozs7Ozs7Ozs7O0FDaEhBLFFBQUEsT0FBQSxzQkFBQSxXQUFBLDRIQUFBLFVBQUEsU0FBQSxZQUFBLFdBQUEsS0FBQSxVQUFBLGVBQUEsU0FBQSxjQUFBO1FBQ0E7O1FBRUEsSUFBQSxVQUFBO1FBQ0EsSUFBQSxTQUFBOztRQUVBLE9BQUEsZ0JBQUE7WUFDQSxNQUFBLFdBQUE7WUFDQSxhQUFBLFdBQUE7WUFDQSxlQUFBLFdBQUEsY0FBQTs7O1FBR0EsSUFBQSxvQkFBQSxVQUFBLFVBQUE7WUFDQSxJQUFBLGNBQUE7WUFDQSxTQUFBOzs7UUFHQSxJQUFBLGNBQUEsVUFBQSxNQUFBO1lBQ0EsV0FBQSxPQUFBLEtBQUE7WUFDQSxXQUFBLGNBQUEsS0FBQTtZQUNBLFdBQUEsZ0JBQUEsU0FBQSxLQUFBO1lBQ0EsVUFBQTtZQUNBLFNBQUE7OztRQUdBLElBQUEsY0FBQSxZQUFBO1lBQ0EsSUFBQSxRQUFBO1lBQ0EsU0FBQSxZQUFBO2dCQUNBLE9BQUEsU0FBQSxPQUFBO2dCQUNBOzs7UUFHQSxJQUFBLFdBQUEsVUFBQSxVQUFBO1lBQ0EsSUFBQSxVQUFBO2dCQUNBLElBQUEsUUFBQTtnQkFDQSxTQUFBLFlBQUE7b0JBQ0EsT0FBQSxTQUFBLE9BQUE7b0JBQ0E7bUJBQ0E7Z0JBQ0EsSUFBQSxRQUFBO2dCQUNBLFNBQUEsWUFBQTtvQkFDQSxPQUFBLFNBQUE7b0JBQ0E7Ozs7UUFJQSxPQUFBLFlBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLE9BQUEsZ0JBQUEsWUFBQTtZQUNBLFVBQUEsQ0FBQTs7O1FBR0EsT0FBQSxXQUFBLFlBQUE7WUFDQSxPQUFBOzs7UUFHQSxPQUFBLGtCQUFBLFlBQUE7WUFDQSxPQUFBLFdBQUE7OztRQUdBLE9BQUEsVUFBQSxZQUFBO1lBQ0EsT0FBQSxXQUFBOzs7UUFHQSxPQUFBLGlCQUFBLFlBQUE7WUFDQSxPQUFBLFdBQUE7OztRQUdBLE9BQUEsY0FBQSxZQUFBO1lBQ0EsU0FBQTtZQUNBLFVBQUEsT0FBQTtnQkFDQSxJQUFBLFdBQUE7Z0JBQ0EsTUFBQSxPQUFBLGNBQUE7Z0JBQ0EsYUFBQSxPQUFBLGNBQUE7Z0JBQ0EsZUFBQSxTQUFBLE9BQUEsY0FBQTtlQUNBLGFBQUE7OztRQUdBLE9BQUEsaUJBQUEsWUFBQTtZQUNBLE9BQUEsY0FBQSxPQUFBLFdBQUE7WUFDQSxPQUFBLGNBQUEsY0FBQSxXQUFBO1lBQ0EsT0FBQSxjQUFBLGdCQUFBLFdBQUEsY0FBQTtZQUNBLFVBQUE7OztRQUdBLE9BQUEsYUFBQSxZQUFBO1lBQ0EsSUFBQSxRQUFBLGlEQUFBLFdBQUEsT0FBQSxNQUFBO2dCQUNBLFVBQUEsT0FBQSxDQUFBLElBQUEsV0FBQSxLQUFBLGFBQUEsSUFBQTs7OztRQUlBLE9BQUEsWUFBQSxVQUFBLFVBQUE7O1lBRUEsSUFBQSxRQUFBLGdEQUFBLFdBQUEsT0FBQSxNQUFBO2dCQUNBLGNBQUE7b0JBQ0EsQ0FBQSxlQUFBLFdBQUE7b0JBQ0EsQ0FBQSxJQUFBO29CQUNBLFlBQUE7d0JBQ0EsU0FBQTs7b0JBRUEsSUFBQTs7Ozs7Ozs7Ozs7Ozs7QUN0R0EsUUFBQSxPQUFBLHNCQUFBLFdBQUEsZ0lBQUEsVUFBQSxRQUFBLFlBQUEsU0FBQSxPQUFBLGlCQUFBLFNBQUEsZUFBQSxLQUFBLE1BQUE7UUFDQTs7UUFFQSxJQUFBLFVBQUE7UUFDQSxJQUFBLFVBQUE7O1FBRUEsT0FBQSxZQUFBO1lBQ0EsTUFBQTtZQUNBLFNBQUEsZ0JBQUE7OztRQUdBLElBQUEsY0FBQSxVQUFBLFVBQUE7WUFDQSxJQUFBLGNBQUE7WUFDQSxVQUFBOzs7UUFHQSxJQUFBLGNBQUEsVUFBQSxRQUFBO1lBQ0EsT0FBQSxVQUFBLFNBQUEsT0FBQTtZQUNBLFVBQUE7OztRQUdBLElBQUEsbUJBQUEsVUFBQSxRQUFBLFVBQUE7WUFDQSxPQUFBLGNBQUEsT0FBQSxRQUFBO1lBQ0EsWUFBQTs7O1FBR0EsSUFBQSxnQkFBQSxVQUFBLFFBQUE7WUFDQSxLQUFBLElBQUEsSUFBQSxRQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtnQkFDQSxJQUFBLFFBQUEsR0FBQSxPQUFBLE9BQUEsSUFBQTtvQkFDQSxRQUFBLE9BQUEsR0FBQTtvQkFDQTs7O1lBR0EsVUFBQTs7O1FBR0EsSUFBQSxpQkFBQSxVQUFBLE1BQUE7WUFDQSxLQUFBLElBQUEsSUFBQSxRQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtnQkFDQSxJQUFBLFFBQUEsR0FBQSxPQUFBLEtBQUEsSUFBQTtvQkFDQSxPQUFBOzs7O1lBSUEsT0FBQTs7O1FBR0EsSUFBQSx5QkFBQSxVQUFBLE9BQUE7WUFDQSxPQUFBLE1BQUEsT0FBQTs7O1FBR0EsSUFBQSxpQkFBQSxVQUFBLFFBQUE7WUFDQSxPQUFBLGNBQUEsT0FBQSxRQUFBO1lBQ0EsUUFBQSxLQUFBO1lBQ0EsT0FBQSxVQUFBLE9BQUE7WUFDQSxVQUFBOzs7UUFHQSxPQUFBLFlBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLE9BQUEsZ0JBQUEsWUFBQTtZQUNBLFVBQUEsQ0FBQTs7O1FBR0EsT0FBQSxZQUFBLFlBQUE7WUFDQSxPQUFBOzs7UUFHQSxPQUFBLGFBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLE9BQUEsYUFBQSxZQUFBO1lBQ0EsT0FBQSxRQUFBLFNBQUE7OztRQUdBLE9BQUEsV0FBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsT0FBQSxVQUFBLFVBQUEsSUFBQTtZQUNBLE9BQUEsTUFBQTs7O1FBR0EsT0FBQSxZQUFBLFVBQUEsUUFBQTtZQUNBLE9BQUEsWUFBQSxPQUFBOzs7UUFHQSxPQUFBLGFBQUEsVUFBQSxRQUFBO1lBQ0EsVUFBQTtZQUNBLGNBQUE7Z0JBQ0EsQ0FBQSxlQUFBLFdBQUE7Z0JBQ0EsQ0FBQSxJQUFBLE9BQUEsSUFBQSxTQUFBLFNBQUEsT0FBQTtnQkFDQSxZQUFBO29CQUNBLFlBQUE7O2dCQUVBLFVBQUEsVUFBQTtvQkFDQSxpQkFBQSxRQUFBOzs7OztRQUtBLE9BQUEsZUFBQSxVQUFBLFFBQUE7WUFDQSxVQUFBO1lBQ0EsY0FBQTtnQkFDQSxDQUFBLGVBQUEsV0FBQTtnQkFDQSxDQUFBLElBQUEsT0FBQTtnQkFDQSxZQUFBO29CQUNBLGNBQUE7O2dCQUVBOzs7O1FBSUEsT0FBQSxXQUFBLFVBQUEsTUFBQTtZQUNBLElBQUEsUUFBQSxLQUFBLGFBQUEsS0FBQSxVQUFBO2dCQUNBLE9BQUEsS0FBQSxZQUFBLE1BQUEsS0FBQTs7O1lBR0EsT0FBQTs7O1FBR0EsT0FBQSxXQUFBLFVBQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxLQUFBLENBQUEsT0FBQSxtQkFBQSxTQUFBO2lCQUNBLEtBQUE7OztRQUdBLE9BQUEsaUJBQUEsWUFBQTtZQUNBLE9BQUEsT0FBQSxVQUFBO2dCQUNBLE9BQUEsVUFBQSxLQUFBLE9BQUE7Z0JBQ0EsZUFBQSxPQUFBLFVBQUE7Z0JBQ0EsT0FBQSxVQUFBLFlBQUE7OztRQUdBLE9BQUEsZUFBQSxZQUFBO1lBQ0EsSUFBQSxDQUFBLE9BQUEsa0JBQUE7O1lBRUEsVUFBQTtZQUNBLElBQUEsU0FBQSxPQUFBLFVBQUE7O1lBRUEsT0FBQSxVQUFBLFNBQUEsT0FBQSxVQUFBOztZQUVBLGNBQUE7Z0JBQ0EsQ0FBQSxlQUFBLFdBQUE7Z0JBQ0EsQ0FBQSxJQUFBLE9BQUEsSUFBQSxTQUFBLE9BQUE7Z0JBQ0EsWUFBQTtvQkFDQSxlQUFBOztnQkFFQTs7Ozs7O1FBTUEsS0FBQSxJQUFBLElBQUEsUUFBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7WUFDQSxRQUFBLEdBQUEsY0FBQSxRQUFBLEdBQUEsUUFBQTs7Ozs7Ozs7Ozs7Ozs7OztBQ3hKQSxPQUFBLFNBQUEsbUJBQUEsSUFBQSxTQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ09BLE9BQUEsU0FBQSxjQUFBLElBQUEsU0FBQSx1QkFBQSxJQUFBO0lBQ0EsTUFBQTtRQUNBLFFBQUE7UUFDQSxLQUFBOzs7Ozs7Ozs7QUNoQkEsT0FBQSxXQUFBLG1DQUFBO0lBQ0EsVUFBQTtRQUNBO1lBQ0E7Z0JBQ0E7Z0JBQ0E7WUFDQTtZQUNBO1FBQ0E7UUFDQTtZQUNBO1FBQ0E7SUFDQTtJQUNBLE1BQUEsWUFBQTtRQUNBLE9BQUE7WUFDQSxXQUFBOzs7SUFHQSxZQUFBO1FBQ0EsZ0JBQUEsT0FBQSxTQUFBOztJQUVBLE9BQUE7UUFDQSxNQUFBO1lBQ0EsTUFBQTtZQUNBLFVBQUE7O1FBRUEsUUFBQTtZQUNBLE1BQUE7WUFDQSxVQUFBOztRQUVBLFdBQUE7WUFDQSxNQUFBO1lBQ0EsU0FBQTs7UUFFQSxZQUFBO1lBQ0EsTUFBQTtZQUNBLFNBQUE7O1FBRUEsYUFBQTtZQUNBLE1BQUE7WUFDQSxTQUFBOztRQUVBLGFBQUE7WUFDQSxNQUFBO1lBQ0EsU0FBQTs7UUFFQSxXQUFBO1lBQ0EsTUFBQTtZQUNBLFNBQUE7OztJQUdBLFVBQUE7UUFDQSxVQUFBLFlBQUE7WUFDQSxJQUFBLE1BQUE7WUFDQSxLQUFBLElBQUEsSUFBQSxLQUFBLE9BQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO2dCQUNBLElBQUEsS0FBQSxPQUFBLEdBQUEsTUFBQSxLQUFBLE9BQUE7OztZQUdBLE9BQUE7O1FBRUEsZ0JBQUEsWUFBQTtZQUNBLElBQUEsV0FBQTtZQUNBLElBQUE7OztZQUdBLEtBQUEsSUFBQSxJQUFBLEdBQUEsU0FBQSxLQUFBLE9BQUEsUUFBQSxJQUFBLFFBQUEsS0FBQTtnQkFDQSxTQUFBLEtBQUEsT0FBQSxHQUFBO2dCQUNBLElBQUEsU0FBQSxlQUFBLFNBQUE7b0JBQ0EsU0FBQSxRQUFBLEtBQUEsS0FBQSxPQUFBO3VCQUNBO29CQUNBLFNBQUEsVUFBQSxDQUFBLEtBQUEsT0FBQTs7Ozs7WUFLQSxLQUFBLElBQUEsS0FBQSxPQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtnQkFDQSxJQUFBLFNBQUEsZUFBQSxLQUFBLE9BQUEsR0FBQSxLQUFBO29CQUNBLElBQUEsSUFBQSxLQUFBLE9BQUEsSUFBQSxZQUFBLFNBQUEsS0FBQSxPQUFBLEdBQUE7dUJBQ0E7b0JBQ0EsSUFBQSxJQUFBLEtBQUEsT0FBQSxJQUFBLFlBQUE7O29CQUVBLEtBQUEsT0FBQSxHQUFBLE9BQUE7Ozs7WUFJQSxPQUFBOztRQUVBLFlBQUEsWUFBQTtZQUNBLE9BQUEsS0FBQSxlQUFBOztRQUVBLGVBQUEsWUFBQTtZQUNBLE9BQUEsS0FBQSxZQUFBLFdBQUE7OztJQUdBLFNBQUE7UUFDQSxVQUFBLFVBQUEsSUFBQTtZQUNBLE9BQUEsS0FBQSxTQUFBLGVBQUE7O1FBRUEsVUFBQSxVQUFBLElBQUE7WUFDQSxPQUFBLEtBQUEsU0FBQTs7UUFFQSxZQUFBLFVBQUEsT0FBQTtZQUNBLElBQUEsVUFBQTtZQUNBLE9BQUEsTUFBQSxjQUFBLE1BQUE7Z0JBQ0EsUUFBQSxLQUFBLFNBQUEsTUFBQTtnQkFDQSxRQUFBLFFBQUEsTUFBQTs7O1lBR0EsT0FBQTs7UUFFQSxZQUFBLFVBQUEsT0FBQTtZQUNBLEtBQUEsTUFBQSxVQUFBOztRQUVBLGNBQUEsVUFBQSxPQUFBO1lBQ0EsS0FBQSxNQUFBLFlBQUE7O1FBRUEsWUFBQSxVQUFBLE9BQUE7WUFDQSxLQUFBLE1BQUEsVUFBQTs7UUFFQSxhQUFBLFVBQUEsT0FBQTtZQUNBLElBQUEsQ0FBQSxLQUFBLGFBQUE7Z0JBQ0EsS0FBQTs7Ozs7WUFLQSxJQUFBLEtBQUEsU0FBQSxNQUFBLEtBQUE7Z0JBQ0EsTUFBQSxXQUFBO2dCQUNBLEtBQUEsWUFBQTtnQkFDQSxJQUFBLFVBQUEsS0FBQSxXQUFBO2dCQUNBLEtBQUEsSUFBQSxJQUFBLFFBQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO29CQUNBLEtBQUEsU0FBQSxRQUFBLElBQUEsT0FBQTs7OztRQUlBLGVBQUEsVUFBQSxPQUFBO1lBQ0EsSUFBQSxLQUFBLFNBQUEsTUFBQSxLQUFBO2dCQUNBLE1BQUEsV0FBQTs7O1FBR0EscUJBQUEsWUFBQTtZQUNBLEtBQUEsSUFBQSxJQUFBLEtBQUEsT0FBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7Z0JBQ0EsS0FBQSxPQUFBLEdBQUEsV0FBQTs7O1FBR0EsVUFBQSxZQUFBO1lBQ0EsS0FBQSxZQUFBLENBQUEsS0FBQTs7O0lBR0EsU0FBQSxZQUFBOztRQUVBLEtBQUEsSUFBQSxLQUFBLE9BQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO1lBQ0EsSUFBQSxJQUFBLEtBQUEsT0FBQSxJQUFBLFFBQUE7WUFDQSxJQUFBLElBQUEsS0FBQSxPQUFBLElBQUEsWUFBQTs7Ozs7OztRQU9BLElBQUEsS0FBQSxZQUFBO1lBQ0EsS0FBQSxJQUFBLFVBQUEsS0FBQTtZQUNBLEtBQUEsSUFBQSxZQUFBLEtBQUE7ZUFDQTtZQUNBLEtBQUEsUUFBQSxJQUFBLFVBQUEsS0FBQTtZQUNBLEtBQUEsUUFBQSxJQUFBLFlBQUEsS0FBQTtZQUNBLEtBQUEsUUFBQSxJQUFBLFNBQUEsS0FBQTs7Ozs7Ozs7OztBQ3RLQSxPQUFBLFdBQUEsd0NBQUE7SUFDQSxNQUFBO0lBQ0EsVUFBQTtRQUNBO1lBQ0E7WUFDQTtZQUNBO2dCQUNBO1lBQ0E7WUFDQTtRQUNBO1FBQ0E7WUFDQTtRQUNBO0lBQ0E7SUFDQSxNQUFBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsV0FBQTs7O0lBR0EsT0FBQTtRQUNBLE9BQUE7WUFDQSxNQUFBO1lBQ0EsVUFBQTs7UUFFQSxlQUFBO1lBQ0EsTUFBQTtZQUNBLFVBQUE7O1FBRUEsV0FBQTtZQUNBLE1BQUE7WUFDQSxTQUFBOzs7SUFHQSxVQUFBO1FBQ0EsYUFBQSxZQUFBO1lBQ0EsT0FBQTtnQkFDQSw4QkFBQSxLQUFBLE1BQUE7Z0JBQ0EsZ0NBQUEsS0FBQSxNQUFBOzs7UUFHQSxZQUFBLFlBQUE7WUFDQSxPQUFBO2dCQUNBLG9CQUFBLE1BQUEsS0FBQSxNQUFBOzs7UUFHQSxnQkFBQSxZQUFBO1lBQ0EsT0FBQTtnQkFDQSx3QkFBQSxDQUFBLEtBQUE7Z0JBQ0Esa0JBQUEsS0FBQTs7O1FBR0EsYUFBQSxZQUFBO1lBQ0EsT0FBQSxrQkFBQSxLQUFBLE1BQUE7OztJQUdBLFNBQUE7UUFDQSxjQUFBLFlBQUE7WUFDQSxJQUFBLENBQUEsS0FBQSxNQUFBLFVBQUE7Z0JBQ0EsS0FBQSxNQUFBLFVBQUEsS0FBQTttQkFDQTtnQkFDQSxLQUFBLE1BQUEsWUFBQSxLQUFBOzs7O1FBSUEsWUFBQSxZQUFBO1lBQ0EsS0FBQSxXQUFBLEtBQUE7O1FBRUEsWUFBQSxZQUFBOztZQUVBLElBQUEsQ0FBQSxLQUFBLE1BQUEsVUFBQTtnQkFDQSxLQUFBO21CQUNBO2dCQUNBLEtBQUEsTUFBQSxPQUFBLENBQUEsS0FBQSxNQUFBOzs7UUFHQSxpQkFBQSxZQUFBO1lBQ0EsS0FBQSxZQUFBLENBQUEsS0FBQTs7UUFFQSxZQUFBLFVBQUEsT0FBQTs7WUFFQSxLQUFBLE1BQUEsVUFBQTs7UUFFQSxjQUFBLFVBQUEsT0FBQTs7WUFFQSxLQUFBLE1BQUEsWUFBQTs7UUFFQSxZQUFBLFVBQUEsT0FBQTs7WUFFQSxLQUFBLE1BQUEsVUFBQTs7Ozs7Ozs7OztBQ3pGQSxPQUFBLFdBQUEsb0NBQUE7SUFDQSxVQUFBO1FBQ0E7WUFDQTtZQUNBO1FBQ0E7UUFDQTtZQUNBO1FBQ0E7SUFDQTtJQUNBLFlBQUE7UUFDQSxnQkFBQSxPQUFBLFNBQUE7UUFDQSxXQUFBLE9BQUEsU0FBQTs7SUFFQSxPQUFBO1FBQ0EsT0FBQTtZQUNBLE1BQUE7WUFDQSxVQUFBOztRQUVBLFdBQUE7WUFDQSxNQUFBO1lBQ0EsU0FBQTs7UUFFQSxXQUFBO1lBQ0EsTUFBQTtZQUNBLFNBQUE7O1FBRUEsYUFBQTtZQUNBLE1BQUE7WUFDQSxTQUFBOzs7SUFHQSxVQUFBOztRQUVBLFFBQUEsWUFBQTtZQUNBLElBQUEsU0FBQTtZQUNBLEtBQUEsSUFBQSxJQUFBLEtBQUEsTUFBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7Z0JBQ0EsTUFBQSxVQUFBLEtBQUEsTUFBQSxRQUFBLEtBQUEsTUFBQSxHQUFBOzs7WUFHQSxPQUFBOzs7SUFHQSxTQUFBO1FBQ0EsY0FBQSxVQUFBLE9BQUE7WUFDQSxLQUFBLE1BQUEsVUFBQTs7UUFFQSxnQkFBQSxVQUFBLE9BQUE7WUFDQSxLQUFBLE1BQUEsWUFBQTs7UUFFQSxPQUFBLFlBQUE7WUFDQSxLQUFBLE1BQUE7Ozs7Ozs7Ozs7QUNuREEsT0FBQSxXQUFBLHdDQUFBO0lBQ0EsVUFBQTtJQUNBLE1BQUEsWUFBQTtRQUNBLE9BQUE7WUFDQSxVQUFBOzs7SUFHQSxZQUFBO1FBQ0EsV0FBQSxTQUFBOztJQUVBLE9BQUE7UUFDQSxRQUFBO1lBQ0EsTUFBQTtZQUNBLFVBQUE7O1FBRUEsYUFBQTtZQUNBLE1BQUE7WUFDQSxTQUFBOztRQUVBLFVBQUE7WUFDQSxNQUFBO1lBQ0EsU0FBQTs7UUFFQSxPQUFBO1lBQ0EsTUFBQTtZQUNBLFNBQUE7OztJQUdBLFNBQUE7UUFDQSxhQUFBLFVBQUEsT0FBQSxXQUFBO1lBQ0EsS0FBQSxNQUFBLFVBQUE7WUFDQSxVQUFBOzs7Ozs7Ozs7O0FDL0JBLE9BQUEsV0FBQSx5Q0FBQTtJQUNBLFFBQUEsQ0FBQSxPQUFBLFNBQUE7SUFDQSxTQUFBO1FBQ0EsUUFBQSxZQUFBO1lBQ0EsSUFBQSxRQUFBO2dCQUNBLE1BQUEsS0FBQTtnQkFDQSxPQUFBLEtBQUE7OztZQUdBLElBQUEsS0FBQSxRQUFBO2dCQUNBLE1BQUEsWUFBQSxLQUFBLE9BQUE7OztZQUdBLEtBQUEsTUFBQSxVQUFBOzs7Ozs7Ozs7O0FDYkEsT0FBQSxXQUFBLHdDQUFBO0lBQ0EsUUFBQSxDQUFBLE9BQUEsU0FBQTtJQUNBLFlBQUE7UUFDQSxpQkFBQSxPQUFBLFNBQUE7O0lBRUEsTUFBQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLFNBQUE7WUFDQSxXQUFBO1lBQ0EsYUFBQTs7O0lBR0EsVUFBQTtRQUNBLFlBQUEsWUFBQTtZQUNBLE9BQUEsS0FBQSxRQUFBLFNBQUE7O1FBRUEsc0JBQUEsWUFBQTtZQUNBLE9BQUE7Z0JBQ0EsUUFBQSxLQUFBO2dCQUNBLGVBQUEsS0FBQTs7OztJQUlBLFNBQUE7UUFDQSxRQUFBLFlBQUE7OztRQUdBLFVBQUEsWUFBQTtZQUNBLElBQUEsUUFBQSxPQUFBLFNBQUE7WUFDQSxJQUFBLGNBQUEsT0FBQSxTQUFBO1lBQ0EsSUFBQSxXQUFBLE9BQUEsU0FBQTtZQUNBLElBQUEsT0FBQTtZQUNBLEtBQUEsTUFBQTs7WUFFQSxZQUFBLE1BQUEsQ0FBQSxJQUFBLE1BQUEsSUFBQSxPQUFBLEtBQUE7aUJBQ0EsS0FBQSxLQUFBLGVBQUEsU0FBQTtpQkFDQSxRQUFBLFlBQUE7b0JBQ0EsS0FBQSxjQUFBO29CQUNBLEtBQUEsTUFBQTs7O1FBR0EsZUFBQSxVQUFBLFVBQUE7WUFDQSxLQUFBLFVBQUEsU0FBQTs7UUFFQSxZQUFBLFVBQUEsTUFBQTtZQUNBLElBQUEsUUFBQSxPQUFBLFNBQUE7O1lBRUEsSUFBQSxRQUFBO2dCQUNBLE1BQUEsS0FBQTtnQkFDQSxPQUFBLEtBQUE7Z0JBQ0EsV0FBQSxLQUFBO2dCQUNBLGlCQUFBLE1BQUE7OztZQUdBLElBQUEsS0FBQSxXQUFBO2dCQUNBLE1BQUEsWUFBQTttQkFDQSxJQUFBLEtBQUEsUUFBQTtnQkFDQSxNQUFBLFlBQUEsS0FBQSxPQUFBOzs7WUFHQSxLQUFBLE1BQUEsVUFBQTs7UUFFQSxpQkFBQSxZQUFBO1lBQ0EsS0FBQSxZQUFBLENBQUEsS0FBQTs7Ozs7Ozs7OztBQy9EQSxPQUFBLFdBQUEseUNBQUE7SUFDQSxPQUFBO1FBQ0EsTUFBQTtZQUNBLE1BQUE7WUFDQSxVQUFBOztRQUVBLFdBQUE7WUFDQSxNQUFBO1lBQ0EsVUFBQTs7UUFFQSxRQUFBO1lBQ0EsTUFBQTtZQUNBLFVBQUE7O1FBRUEsUUFBQTtZQUNBLE1BQUE7WUFDQSxTQUFBOzs7SUFHQSxVQUFBO1FBQ0EsZ0JBQUEsWUFBQTtZQUNBLE9BQUEsS0FBQSxLQUFBLFFBQUEsS0FBQTs7UUFFQSxhQUFBLFlBQUE7WUFDQSxJQUFBLEtBQUEsV0FBQTtnQkFDQSxPQUFBLFNBQUEsS0FBQSxLQUFBLE9BQUE7OztZQUdBLElBQUEsS0FBQSxRQUFBO2dCQUNBLE9BQUEsU0FBQSxLQUFBLEtBQUEsT0FBQSxvQkFBQSxLQUFBLE9BQUE7OztZQUdBLE9BQUEsU0FBQSxLQUFBLEtBQUEsT0FBQTs7UUFFQSxhQUFBLFlBQUE7WUFDQSxPQUFBO2dCQUNBLDJCQUFBLEtBQUE7OztRQUdBLFVBQUEsWUFBQTtZQUNBLElBQUEsT0FBQTtZQUNBLE9BQUEsQ0FBQSxDQUFBLEtBQUEsT0FBQSxLQUFBLFVBQUEsT0FBQTtnQkFDQSxPQUFBLE1BQUEsYUFBQSxLQUFBLEtBQUE7Ozs7SUFJQSxTQUFBO1FBQ0EsUUFBQSxZQUFBO1lBQ0EsSUFBQSxDQUFBLEtBQUEsVUFBQTtnQkFDQSxLQUFBLE1BQUEsVUFBQSxLQUFBOzs7Ozs7Ozs7OztBQ2pEQSxPQUFBLFdBQUEsd0NBQUE7SUFDQSxPQUFBO1FBQ0EsUUFBQTtZQUNBLE1BQUE7WUFDQSxVQUFBOztRQUVBLE9BQUE7WUFDQSxNQUFBO1lBQ0EsU0FBQTs7UUFFQSxRQUFBO1lBQ0EsTUFBQTtZQUNBLFNBQUE7O1FBRUEsTUFBQTtZQUNBLE1BQUE7WUFDQSxTQUFBOzs7SUFHQSxZQUFBO1FBQ0EsZ0JBQUEsT0FBQSxTQUFBOztJQUVBLFVBQUE7UUFDQSxlQUFBO1lBQ0EsS0FBQSxZQUFBO2dCQUNBLE9BQUEsS0FBQTs7WUFFQSxLQUFBLFVBQUEsT0FBQTtnQkFDQSxLQUFBLE1BQUEsU0FBQTs7O1FBR0EsY0FBQTtZQUNBLEtBQUEsWUFBQTtnQkFDQSxPQUFBLEtBQUE7O1lBRUEsS0FBQSxVQUFBLE1BQUE7Z0JBQ0EsS0FBQSxNQUFBLFFBQUE7OztRQUdBLGdCQUFBLFlBQUE7WUFDQSxPQUFBLEtBQUEsU0FBQSxLQUFBLE9BQUEsT0FBQTs7UUFFQSxhQUFBLFlBQUE7WUFDQSxPQUFBLEtBQUEsT0FBQSxXQUFBOztRQUVBLGFBQUEsWUFBQTtZQUNBLE9BQUEsQ0FBQSxLQUFBOztRQUVBLFdBQUEsWUFBQTtZQUNBLE9BQUEsQ0FBQSxLQUFBOzs7SUFHQSxTQUFBO1FBQ0EsY0FBQSxZQUFBO1lBQ0EsS0FBQSxnQkFBQSxPQUFBLFNBQUE7O1FBRUEsYUFBQSxZQUFBO1lBQ0EsS0FBQSxNQUFBLFVBQUE7O1FBRUEsYUFBQSxVQUFBLE9BQUE7WUFDQSxLQUFBLE1BQUEsVUFBQTs7OztBQUlBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBuYW1lc3BhY2UgYmlpZ2xlLmxhYmVsLXRyZWVzXG4gKiBAZGVzY3JpcHRpb24gVGhlIEJJSUdMRSBsYWJlbCB0cmVlcyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdiaWlnbGUubGFiZWwtdHJlZXMnLCBbJ2JpaWdsZS5hcGknLCAnYmlpZ2xlLnVpJ10pO1xuXG4vKlxuICogRGlzYWJsZSBkZWJ1ZyBpbmZvIGluIHByb2R1Y3Rpb24gZm9yIGJldHRlciBwZXJmb3JtYW5jZS5cbiAqIHNlZTogaHR0cHM6Ly9jb2RlLmFuZ3VsYXJqcy5vcmcvMS40LjcvZG9jcy9ndWlkZS9wcm9kdWN0aW9uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdiaWlnbGUubGFiZWwtdHJlZXMnKS5jb25maWcoZnVuY3Rpb24gKCRjb21waWxlUHJvdmlkZXIpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICRjb21waWxlUHJvdmlkZXIuZGVidWdJbmZvRW5hYmxlZChmYWxzZSk7XG59KTtcbiIsIi8qKlxuICogVGhlIHBhbmVsIGZvciBlZGl0aW5nIHRoZSBsYWJlbHMgb2YgYSBsYWJlbCB0cmVlXG4gKi9cbmJpaWdsZS4kdmlld01vZGVsKCdsYWJlbC10cmVlcy1sYWJlbHMnLCBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgIHZhciBsYWJlbHMgPSBiaWlnbGUuJHJlcXVpcmUoJ2FwaS5sYWJlbHMnKTtcbiAgICB2YXIgbWVzc2FnZXMgPSBiaWlnbGUuJHJlcXVpcmUoJ21lc3NhZ2VzLnN0b3JlJyk7XG4gICAgdmFyIHJhbmRvbUNvbG9yID0gYmlpZ2xlLiRyZXF1aXJlKCdsYWJlbFRyZWVzLnJhbmRvbUNvbG9yJyk7XG4gICAgdmFyIGxhYmVsVHJlZSA9IGJpaWdsZS4kcmVxdWlyZSgnbGFiZWxUcmVlcy5sYWJlbFRyZWUnKTtcblxuICAgIG5ldyBWdWUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgZWRpdGluZzogZmFsc2UsXG4gICAgICAgICAgICBsb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGxhYmVsczogYmlpZ2xlLiRyZXF1aXJlKCdsYWJlbFRyZWVzLmxhYmVscycpLFxuICAgICAgICAgICAgc2VsZWN0ZWRDb2xvcjogcmFuZG9tQ29sb3IoKSxcbiAgICAgICAgICAgIHNlbGVjdGVkTGFiZWw6IG51bGwsXG4gICAgICAgICAgICBzZWxlY3RlZE5hbWU6ICcnLFxuICAgICAgICB9LFxuICAgICAgICBjb21wb25lbnRzOiB7XG4gICAgICAgICAgICB0eXBlYWhlYWQ6IFZ1ZVN0cmFwLnR5cGVhaGVhZCxcbiAgICAgICAgICAgIHRhYnM6IFZ1ZVN0cmFwLnRhYnMsXG4gICAgICAgICAgICB0YWI6IFZ1ZVN0cmFwLnRhYixcbiAgICAgICAgICAgIGxhYmVsVHJlZTogYmlpZ2xlLiRyZXF1aXJlKCdsYWJlbFRyZWVzLmNvbXBvbmVudHMubGFiZWxUcmVlJyksXG4gICAgICAgICAgICBtYW51YWxMYWJlbEZvcm06IGJpaWdsZS4kcmVxdWlyZSgnbGFiZWxUcmVlcy5jb21wb25lbnRzLm1hbnVhbExhYmVsRm9ybScpLFxuICAgICAgICAgICAgd29ybXNMYWJlbEZvcm06IGJpaWdsZS4kcmVxdWlyZSgnbGFiZWxUcmVlcy5jb21wb25lbnRzLndvcm1zTGFiZWxGb3JtJyksXG4gICAgICAgIH0sXG4gICAgICAgIGNvbXB1dGVkOiB7XG4gICAgICAgICAgICBjbGFzc09iamVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICdwYW5lbC13YXJuaW5nJzogdGhpcy5lZGl0aW5nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIG1ldGhvZHM6IHtcbiAgICAgICAgICAgIHRvZ2dsZUVkaXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVkaXRpbmcgPSAhdGhpcy5lZGl0aW5nO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0TG9hZGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmluaXNoTG9hZGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlbGV0ZUxhYmVsOiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydExvYWRpbmcoKTtcbiAgICAgICAgICAgICAgICBsYWJlbHMuZGVsZXRlKHtpZDogbGFiZWwuaWR9KVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmxhYmVsRGVsZXRlZChsYWJlbCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIG1lc3NhZ2VzLmhhbmRsZUVycm9yUmVzcG9uc2UpXG4gICAgICAgICAgICAgICAgICAgIC5maW5hbGx5KHRoaXMuZmluaXNoTG9hZGluZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGFiZWxEZWxldGVkOiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZExhYmVsICYmIHRoaXMuc2VsZWN0ZWRMYWJlbC5pZCA9PT0gbGFiZWwuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXNlbGVjdExhYmVsKGxhYmVsKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5sYWJlbHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubGFiZWxzW2ldLmlkID09PSBsYWJlbC5pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sYWJlbHMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2VsZWN0TGFiZWw6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRMYWJlbCA9IGxhYmVsO1xuICAgICAgICAgICAgICAgIGlmICghbGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kZW1pdCgnY2xlYXInKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkQ29sb3IgPSAnIycgKyBsYWJlbC5jb2xvcjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kZW1pdCgnc2VsZWN0JywgbGFiZWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZXNlbGVjdExhYmVsOiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkTGFiZWwgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuJGVtaXQoJ2Rlc2VsZWN0JywgbGFiZWwpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNlbGVjdENvbG9yOiBmdW5jdGlvbiAoY29sb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkQ29sb3IgPSBjb2xvcjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZWxlY3ROYW1lOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWROYW1lID0gbmFtZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbnNlcnRMYWJlbDogZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgVnVlLnNldChsYWJlbCwgJ29wZW4nLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgVnVlLnNldChsYWJlbCwgJ3NlbGVjdGVkJywgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gbGFiZWwubmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIC8vIGFkZCB0aGUgbGFiZWwgdG8gdGhlIGFycmF5IHNvIHRoZSBsYWJlbHMgcmVtYWluIHNvcnRlZCBieSB0aGVpciBuYW1lXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IHRoaXMubGFiZWxzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmxhYmVsc1tpXS5uYW1lLnRvTG93ZXJDYXNlKCkgPj0gbmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sYWJlbHMuc3BsaWNlKGksIDAsIGxhYmVsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgZnVuY3Rpb24gZGlkbid0IHJldHVybiBieSBub3cgdGhlIGxhYmVsIGlzIFwic21hbGxlclwiIHRoYW4gYWxsXG4gICAgICAgICAgICAgICAgLy8gdGhlIG90aGVyIGxhYmVscy5cbiAgICAgICAgICAgICAgICB0aGlzLmxhYmVscy5wdXNoKGxhYmVsKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVMYWJlbDogZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubG9hZGluZykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydExvYWRpbmcoKTtcbiAgICAgICAgICAgICAgICBsYWJlbHMuc2F2ZSh7bGFiZWxfdHJlZV9pZDogbGFiZWxUcmVlLmlkfSwgbGFiZWwpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKHRoaXMubGFiZWxDcmVhdGVkLCBtZXNzYWdlcy5oYW5kbGVFcnJvclJlc3BvbnNlKVxuICAgICAgICAgICAgICAgICAgICAuZmluYWxseSh0aGlzLmZpbmlzaExvYWRpbmcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhYmVsQ3JlYXRlZDogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5mb3JFYWNoKHRoaXMuaW5zZXJ0TGFiZWwpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRDb2xvciA9IHJhbmRvbUNvbG9yKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZE5hbWUgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG4iLCIvKipcbiAqIEZ1bmN0aW9uIHJldHVybmluZyBhIHJhbmRvbSBjb2xvclxuICovXG5iaWlnbGUuJGRlY2xhcmUoJ2xhYmVsVHJlZXMucmFuZG9tQ29sb3InLCBmdW5jdGlvbiAoKSB7XG4gICAgLy8gSFNWIHZhbHVlc1xuICAgIHZhciBNSU4gPSBbMCwgMC41LCAwLjldO1xuICAgIHZhciBNQVggPSBbMzYwLCAxLCAxXTtcblxuICAgIC8vIG51bWJlciBvZiBkZWNpbWFscyB0byBrZWVwXG4gICAgdmFyIFBSRUNJU0lPTiA9IFswLCAyLCAyXTtcblxuICAgIC8vIHNlZSBodHRwczovL2RlLndpa2lwZWRpYS5vcmcvd2lraS9IU1YtRmFyYnJhdW0jVHJhbnNmb3JtYXRpb25fdm9uX1JHQl91bmRfSFNWLjJGSFNMXG4gICAgdmFyIHRvUmdiID0gZnVuY3Rpb24gKGhzdikge1xuICAgICAgICB2YXIgdG1wID0gaHN2WzBdIC8gNjA7XG4gICAgICAgIHZhciBoaSA9IE1hdGguZmxvb3IodG1wKTtcbiAgICAgICAgdmFyIGYgPSB0bXAgLSBoaTtcbiAgICAgICAgdmFyIHBxdCA9IFtcbiAgICAgICAgICAgIGhzdlsyXSAqICgxIC0gaHN2WzFdKSxcbiAgICAgICAgICAgIGhzdlsyXSAqICgxIC0gaHN2WzFdICogZiksXG4gICAgICAgICAgICBoc3ZbMl0gKiAoMSAtIGhzdlsxXSAqICgxIC0gZikpXG4gICAgICAgIF07XG5cbiAgICAgICAgdmFyIHJnYjtcblxuICAgICAgICBzd2l0Y2ggKGhpKSB7XG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgcmdiID0gW3BxdFsxXSwgaHN2WzJdLCBwcXRbMF1dO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgIHJnYiA9IFtwcXRbMF0sIGhzdlsyXSwgcHF0WzJdXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICByZ2IgPSBbcHF0WzBdLCBwcXRbMV0sIGhzdlsyXV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgcmdiID0gW3BxdFsyXSwgcHF0WzBdLCBoc3ZbMl1dO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgICAgIHJnYiA9IFtoc3ZbMl0sIHBxdFswXSwgcHF0WzFdXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmdiID0gW2hzdlsyXSwgcHF0WzJdLCBwcXRbMF1dO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJnYi5tYXAoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoaXRlbSAqIDI1NSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB2YXIgdG9IZXggPSBmdW5jdGlvbiAocmdiKSB7XG4gICAgICAgIHJldHVybiByZ2IubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICBpdGVtID0gaXRlbS50b1N0cmluZygxNik7XG4gICAgICAgICAgICByZXR1cm4gKGl0ZW0ubGVuZ3RoID09PSAxKSA/ICgnMCcgKyBpdGVtKSA6IGl0ZW07XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY29sb3IgPSBbMCwgMCwgMF07XG4gICAgICAgIHZhciBwcmVjaXNpb247XG4gICAgICAgIGZvciAodmFyIGkgPSBjb2xvci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgcHJlY2lzaW9uID0gMTAgKiBQUkVDSVNJT05baV07XG4gICAgICAgICAgICBjb2xvcltpXSA9IChNQVhbaV0gLSBNSU5baV0pICogTWF0aC5yYW5kb20oKSArIE1JTltpXTtcbiAgICAgICAgICAgIGlmIChwcmVjaXNpb24gIT09IDApIHtcbiAgICAgICAgICAgICAgICBjb2xvcltpXSA9IE1hdGgucm91bmQoY29sb3JbaV0gKiBwcmVjaXNpb24pIC8gcHJlY2lzaW9uO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb2xvcltpXSA9IE1hdGgucm91bmQoY29sb3JbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICcjJyArIHRvSGV4KHRvUmdiKGNvbG9yKSkuam9pbignJyk7XG4gICAgfTtcbn0pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEF1dGhvcml6ZWRQcm9qZWN0c0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBiaWlnbGUubGFiZWwtdHJlZXNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgdGhlIGF1dG9yaXplZCBwcm9qZWN0cyBvZiBhIGxhYmVsIHRyZWVcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2JpaWdsZS5sYWJlbC10cmVlcycpLmNvbnRyb2xsZXIoJ0F1dGhvcml6ZWRQcm9qZWN0c0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBMQUJFTF9UUkVFLCBBVVRIX1BST0pFQ1RTLCBBVVRIX09XTl9QUk9KRUNUUywgUHJvamVjdCwgTGFiZWxUcmVlQXV0aG9yaXplZFByb2plY3QpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIGVkaXRpbmcgPSBmYWxzZTtcbiAgICAgICAgdmFyIGxvYWRpbmcgPSBmYWxzZTtcblxuICAgICAgICB2YXIgb3duUHJvamVjdHMgPSBudWxsO1xuXG4gICAgICAgIC8vIGFsbCBwcm9qZWN0cyB0aGUgY3VycmVudCB1c2VyIGJlbG9uZ3MgdG8gYW5kIHRoYXQgYXJlIG5vdCBhbHJlYWR5IGF1dGhvcml6ZWRcbiAgICAgICAgdmFyIHByb2plY3RzRm9yQXV0aG9yaXphdGlvbiA9IG51bGw7XG5cbiAgICAgICAgdmFyIHByb2plY3RJc05vdEF1dGhvcml6ZWQgPSBmdW5jdGlvbiAocHJvamVjdCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IEFVVEhfUFJPSkVDVFMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoQVVUSF9QUk9KRUNUU1tpXS5pZCA9PT0gcHJvamVjdC5pZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgdXBkYXRlUHJvamVjdHNGb3JBdXRob3JpemF0aW9uID0gZnVuY3Rpb24gKHByb2plY3RzKSB7XG4gICAgICAgICAgICBwcm9qZWN0c0ZvckF1dGhvcml6YXRpb24gPSBwcm9qZWN0cy5maWx0ZXIocHJvamVjdElzTm90QXV0aG9yaXplZCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZUVycm9yID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBtc2cucmVzcG9uc2VFcnJvcihyZXNwb25zZSk7XG4gICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHByb2plY3RBZGRlZCA9IGZ1bmN0aW9uIChwcm9qZWN0KSB7XG4gICAgICAgICAgICBBVVRIX1BST0pFQ1RTLnB1c2gocHJvamVjdCk7XG4gICAgICAgICAgICAvLyB1c2VyIGNhbiBvbmx5IGF1dGhvcml6ZSBvd24gcHJvamVjdHNcbiAgICAgICAgICAgIEFVVEhfT1dOX1BST0pFQ1RTLnB1c2gocHJvamVjdC5pZCk7XG4gICAgICAgICAgICB1cGRhdGVQcm9qZWN0c0ZvckF1dGhvcml6YXRpb24ob3duUHJvamVjdHMpO1xuICAgICAgICAgICAgbG9hZGluZyA9IGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBwcm9qZWN0UmVtb3ZlZCA9IGZ1bmN0aW9uIChwcm9qZWN0KSB7XG4gICAgICAgICAgICB2YXIgaTtcbiAgICAgICAgICAgIGZvciAoaSA9IEFVVEhfUFJPSkVDVFMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoQVVUSF9QUk9KRUNUU1tpXS5pZCA9PT0gcHJvamVjdC5pZCkge1xuICAgICAgICAgICAgICAgICAgICBBVVRIX1BST0pFQ1RTLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpID0gQVVUSF9PV05fUFJPSkVDVFMuaW5kZXhPZihwcm9qZWN0LmlkKTtcbiAgICAgICAgICAgIGlmIChpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIEFVVEhfT1dOX1BST0pFQ1RTLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdXBkYXRlUHJvamVjdHNGb3JBdXRob3JpemF0aW9uKG93blByb2plY3RzKTtcbiAgICAgICAgICAgIGxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaGFzUHJvamVjdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gQVVUSF9QUk9KRUNUUy5sZW5ndGggPiAwO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5nZXRQcm9qZWN0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBBVVRIX1BST0pFQ1RTO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc093blByb2plY3QgPSBmdW5jdGlvbiAocHJvamVjdCkge1xuICAgICAgICAgICAgcmV0dXJuIEFVVEhfT1dOX1BST0pFQ1RTLmluZGV4T2YocHJvamVjdC5pZCkgIT09IC0xO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc0VkaXRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZWRpdGluZztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0VmlzaWJpbGl0eUlkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIExBQkVMX1RSRUUudmlzaWJpbGl0eV9pZDtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUudG9nZ2xlRWRpdGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghb3duUHJvamVjdHMpIHtcbiAgICAgICAgICAgICAgICBvd25Qcm9qZWN0cyA9IFByb2plY3QucXVlcnkodXBkYXRlUHJvamVjdHNGb3JBdXRob3JpemF0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWRpdGluZyA9ICFlZGl0aW5nO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc0xvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9hZGluZztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0UHJvamVjdHNGb3JBdXRob3JpemF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHByb2plY3RzRm9yQXV0aG9yaXphdGlvbjtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuYWRkQXV0aG9yaXplZFByb2plY3QgPSBmdW5jdGlvbiAocHJvamVjdCkge1xuICAgICAgICAgICAgbG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICBMYWJlbFRyZWVBdXRob3JpemVkUHJvamVjdC5hZGRBdXRob3JpemVkKFxuICAgICAgICAgICAgICAgIHtpZDogTEFCRUxfVFJFRS5pZH0sXG4gICAgICAgICAgICAgICAge2lkOiBwcm9qZWN0LmlkfSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb2plY3RBZGRlZChwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGhhbmRsZUVycm9yXG4gICAgICAgICAgICApO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5yZW1vdmVBdXRob3JpemVkUHJvamVjdCA9IGZ1bmN0aW9uIChwcm9qZWN0KSB7XG4gICAgICAgICAgICBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIExhYmVsVHJlZUF1dGhvcml6ZWRQcm9qZWN0LnJlbW92ZUF1dGhvcml6ZWQoXG4gICAgICAgICAgICAgICAge2lkOiBMQUJFTF9UUkVFLmlkfSxcbiAgICAgICAgICAgICAgICB7aWQ6IHByb2plY3QuaWR9LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvamVjdFJlbW92ZWQocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBoYW5kbGVFcnJvclxuICAgICAgICAgICAgKTtcbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIExhYmVsVHJlZUNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBiaWlnbGUubGFiZWwtdHJlZXNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgbGFiZWwgdHJlZSBpbmZvcm1hdGlvblxuICovXG5hbmd1bGFyLm1vZHVsZSgnYmlpZ2xlLmxhYmVsLXRyZWVzJykuY29udHJvbGxlcignTGFiZWxUcmVlQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICBMQUJFTF9UUkVFLCBMYWJlbFRyZWUsIG1zZywgJHRpbWVvdXQsIExhYmVsVHJlZVVzZXIsIFVTRVJfSUQsIFJFRElSRUNUX1VSTCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgZWRpdGluZyA9IGZhbHNlO1xuICAgICAgICB2YXIgc2F2aW5nID0gZmFsc2U7XG5cbiAgICAgICAgJHNjb3BlLmxhYmVsVHJlZUluZm8gPSB7XG4gICAgICAgICAgICBuYW1lOiBMQUJFTF9UUkVFLm5hbWUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogTEFCRUxfVFJFRS5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgIHZpc2liaWxpdHlfaWQ6IExBQkVMX1RSRUUudmlzaWJpbGl0eV9pZC50b1N0cmluZygpXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZVNhdmluZ0Vycm9yID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBtc2cucmVzcG9uc2VFcnJvcihyZXNwb25zZSk7XG4gICAgICAgICAgICBzYXZpbmcgPSBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaW5mb1VwZGF0ZWQgPSBmdW5jdGlvbiAodHJlZSkge1xuICAgICAgICAgICAgTEFCRUxfVFJFRS5uYW1lID0gdHJlZS5uYW1lO1xuICAgICAgICAgICAgTEFCRUxfVFJFRS5kZXNjcmlwdGlvbiA9IHRyZWUuZGVzY3JpcHRpb247XG4gICAgICAgICAgICBMQUJFTF9UUkVFLnZpc2liaWxpdHlfaWQgPSBwYXJzZUludCh0cmVlLnZpc2liaWxpdHlfaWQpO1xuICAgICAgICAgICAgZWRpdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgc2F2aW5nID0gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHRyZWVEZWxldGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbXNnLnN1Y2Nlc3MoJ1RoZSBsYWJlbCB0cmVlIHdhcyBkZWxldGVkLiBSZWRpcmVjdGluZy4uLicpO1xuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gUkVESVJFQ1RfVVJMO1xuICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciB1c2VyTGVmdCA9IGZ1bmN0aW9uIChyZWRpcmVjdCkge1xuICAgICAgICAgICAgaWYgKHJlZGlyZWN0KSB7XG4gICAgICAgICAgICAgICAgbXNnLnN1Y2Nlc3MoJ1lvdSBsZWZ0IHRoZSBsYWJlbCB0cmVlLiBSZWRpcmVjdGluZy4uLicpO1xuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBSRURJUkVDVF9VUkw7XG4gICAgICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtc2cuc3VjY2VzcygnWW91IGxlZnQgdGhlIGxhYmVsIHRyZWUuIFJlbG9hZGluZy4uLicpO1xuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNFZGl0aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGVkaXRpbmc7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnRvZ2dsZUVkaXRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBlZGl0aW5nID0gIWVkaXRpbmc7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzU2F2aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHNhdmluZztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0VmlzaWJpbGl0eUlkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIExBQkVMX1RSRUUudmlzaWJpbGl0eV9pZDtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0TmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBMQUJFTF9UUkVFLm5hbWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldERlc2NyaXB0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIExBQkVMX1RSRUUuZGVzY3JpcHRpb247XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnNhdmVDaGFuZ2VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2F2aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIExhYmVsVHJlZS51cGRhdGUoe1xuICAgICAgICAgICAgICAgIGlkOiBMQUJFTF9UUkVFLmlkLFxuICAgICAgICAgICAgICAgIG5hbWU6ICRzY29wZS5sYWJlbFRyZWVJbmZvLm5hbWUsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICRzY29wZS5sYWJlbFRyZWVJbmZvLmRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgIHZpc2liaWxpdHlfaWQ6IHBhcnNlSW50KCRzY29wZS5sYWJlbFRyZWVJbmZvLnZpc2liaWxpdHlfaWQpXG4gICAgICAgICAgICB9LCBpbmZvVXBkYXRlZCwgaGFuZGxlU2F2aW5nRXJyb3IpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5kaXNjYXJkQ2hhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5sYWJlbFRyZWVJbmZvLm5hbWUgPSBMQUJFTF9UUkVFLm5hbWU7XG4gICAgICAgICAgICAkc2NvcGUubGFiZWxUcmVlSW5mby5kZXNjcmlwdGlvbiA9IExBQkVMX1RSRUUuZGVzY3JpcHRpb247XG4gICAgICAgICAgICAkc2NvcGUubGFiZWxUcmVlSW5mby52aXNpYmlsaXR5X2lkID0gTEFCRUxfVFJFRS52aXNpYmlsaXR5X2lkLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBlZGl0aW5nID0gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmRlbGV0ZVRyZWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoY29uZmlybSgnRG8geW91IHJlYWxseSB3YW50IHRvIGRlbGV0ZSB0aGUgbGFiZWwgdHJlZSAnICsgTEFCRUxfVFJFRS5uYW1lICsgJz8nKSkge1xuICAgICAgICAgICAgICAgIExhYmVsVHJlZS5kZWxldGUoe2lkOiBMQUJFTF9UUkVFLmlkfSwgdHJlZURlbGV0ZWQsIG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUubGVhdmVUcmVlID0gZnVuY3Rpb24gKHJlZGlyZWN0KSB7XG4gICAgICAgICAgICAvLyByZWRpcmVjdCBpZiB0aGUgdHJlZSBpcyBwcml2YXRlLCBvdGhlcndpc2UgcmVsb2FkXG4gICAgICAgICAgICBpZiAoY29uZmlybSgnRG8geW91IHJlYWxseSB3YW50IHRvIGxlYXZlIHRoZSBsYWJlbCB0cmVlICcgKyBMQUJFTF9UUkVFLm5hbWUgKyAnPycpKSB7XG4gICAgICAgICAgICAgICAgTGFiZWxUcmVlVXNlci5kZXRhY2goXG4gICAgICAgICAgICAgICAgICAgIHtsYWJlbF90cmVlX2lkOiBMQUJFTF9UUkVFLmlkfSxcbiAgICAgICAgICAgICAgICAgICAge2lkOiBVU0VSX0lEfSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXNlckxlZnQocmVkaXJlY3QpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBtc2cucmVzcG9uc2VFcnJvclxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBiaWlnbGUubGFiZWwtdHJlZXNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBNZW1iZXJzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSB0aGUgbWVtYmVycyBvZiBhIGxhYmVsIHRyZWVcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2JpaWdsZS5sYWJlbC10cmVlcycpLmNvbnRyb2xsZXIoJ01lbWJlcnNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgTEFCRUxfVFJFRSwgTUVNQkVSUywgUk9MRVMsIERFRkFVTFRfUk9MRV9JRCwgVVNFUl9JRCwgTGFiZWxUcmVlVXNlciwgbXNnLCBVc2VyKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBlZGl0aW5nID0gZmFsc2U7XG4gICAgICAgIHZhciBsb2FkaW5nID0gZmFsc2U7XG5cbiAgICAgICAgJHNjb3BlLm5ld01lbWJlciA9IHtcbiAgICAgICAgICAgIHVzZXI6IG51bGwsXG4gICAgICAgICAgICByb2xlX2lkOiBERUZBVUxUX1JPTEVfSUQudG9TdHJpbmcoKVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBoYW5kbGVFcnJvciA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgbXNnLnJlc3BvbnNlRXJyb3IocmVzcG9uc2UpO1xuICAgICAgICAgICAgbG9hZGluZyA9IGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciByb2xlVXBkYXRlZCA9IGZ1bmN0aW9uIChtZW1iZXIpIHtcbiAgICAgICAgICAgIG1lbWJlci5yb2xlX2lkID0gcGFyc2VJbnQobWVtYmVyLnRtcF9yb2xlX2lkKTtcbiAgICAgICAgICAgIGxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcm9sZVVwZGF0ZUZhaWxlZCA9IGZ1bmN0aW9uIChtZW1iZXIsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBtZW1iZXIudG1wX3JvbGVfaWQgPSBtZW1iZXIucm9sZV9pZC50b1N0cmluZygpO1xuICAgICAgICAgICAgaGFuZGxlRXJyb3IocmVzcG9uc2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBtZW1iZXJSZW1vdmVkID0gZnVuY3Rpb24gKG1lbWJlcikge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IE1FTUJFUlMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoTUVNQkVSU1tpXS5pZCA9PT0gbWVtYmVyLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgIE1FTUJFUlMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHVzZXJJc05vTWVtYmVyID0gZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBNRU1CRVJTLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKE1FTUJFUlNbaV0uaWQgPT09IHVzZXIuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGZpbHRlck1lbWJlcnNGcm9tVXNlcnMgPSBmdW5jdGlvbiAodXNlcnMpIHtcbiAgICAgICAgICAgIHJldHVybiB1c2Vycy5maWx0ZXIodXNlcklzTm9NZW1iZXIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBtZW1iZXJBdHRhY2hlZCA9IGZ1bmN0aW9uIChtZW1iZXIpIHtcbiAgICAgICAgICAgIG1lbWJlci50bXBfcm9sZV9pZCA9IG1lbWJlci5yb2xlX2lkLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBNRU1CRVJTLnB1c2gobWVtYmVyKTtcbiAgICAgICAgICAgICRzY29wZS5uZXdNZW1iZXIudXNlciA9IG51bGw7XG4gICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzRWRpdGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBlZGl0aW5nO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS50b2dnbGVFZGl0aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZWRpdGluZyA9ICFlZGl0aW5nO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc0xvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9hZGluZztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0TWVtYmVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBNRU1CRVJTO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5oYXNNZW1iZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIE1FTUJFUlMubGVuZ3RoID4gMDtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0Um9sZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gUk9MRVM7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldFJvbGUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBST0xFU1tpZF07XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzT3duVXNlciA9IGZ1bmN0aW9uIChtZW1iZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBVU0VSX0lEID09PSBtZW1iZXIuaWQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnVwZGF0ZVJvbGUgPSBmdW5jdGlvbiAobWVtYmVyKSB7XG4gICAgICAgICAgICBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIExhYmVsVHJlZVVzZXIudXBkYXRlKFxuICAgICAgICAgICAgICAgIHtsYWJlbF90cmVlX2lkOiBMQUJFTF9UUkVFLmlkfSxcbiAgICAgICAgICAgICAgICB7aWQ6IG1lbWJlci5pZCwgcm9sZV9pZDogcGFyc2VJbnQobWVtYmVyLnRtcF9yb2xlX2lkKX0sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByb2xlVXBkYXRlZChtZW1iZXIpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJvbGVVcGRhdGVGYWlsZWQobWVtYmVyLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZGV0YWNoTWVtYmVyID0gZnVuY3Rpb24gKG1lbWJlcikge1xuICAgICAgICAgICAgbG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICBMYWJlbFRyZWVVc2VyLmRldGFjaChcbiAgICAgICAgICAgICAgICB7bGFiZWxfdHJlZV9pZDogTEFCRUxfVFJFRS5pZH0sXG4gICAgICAgICAgICAgICAge2lkOiBtZW1iZXIuaWR9LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVtYmVyUmVtb3ZlZChtZW1iZXIpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaGFuZGxlRXJyb3JcbiAgICAgICAgICAgICk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnVzZXJuYW1lID0gZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIGlmICh1c2VyICYmIHVzZXIuZmlyc3RuYW1lICYmIHVzZXIubGFzdG5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXNlci5maXJzdG5hbWUgKyAnICcgKyB1c2VyLmxhc3RuYW1lO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmZpbmRVc2VyID0gZnVuY3Rpb24gKHF1ZXJ5KSB7XG4gICAgICAgICAgICByZXR1cm4gVXNlci5maW5kKHtxdWVyeTogZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5KX0pLiRwcm9taXNlXG4gICAgICAgICAgICAgICAgLnRoZW4oZmlsdGVyTWVtYmVyc0Zyb21Vc2Vycyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLm5ld01lbWJlclZhbGlkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5uZXdNZW1iZXIudXNlciAmJlxuICAgICAgICAgICAgICAgICRzY29wZS5uZXdNZW1iZXIudXNlci5pZCAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICAgICAgdXNlcklzTm9NZW1iZXIoJHNjb3BlLm5ld01lbWJlci51c2VyKSAmJlxuICAgICAgICAgICAgICAgICRzY29wZS5uZXdNZW1iZXIucm9sZV9pZCAhPT0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuYXR0YWNoTWVtYmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCEkc2NvcGUubmV3TWVtYmVyVmFsaWQoKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhciBtZW1iZXIgPSAkc2NvcGUubmV3TWVtYmVyLnVzZXI7XG4gICAgICAgICAgICAvLyBvdmVyd3JpdGUgZ2xvYmFsIHJvbGVfaWQgcmV0dXJuZWQgZnJvbSBVc2VyLmZpbmQoKSB3aXRoIGxhYmVsIHRyZWUgcm9sZV9pZFxuICAgICAgICAgICAgbWVtYmVyLnJvbGVfaWQgPSBwYXJzZUludCgkc2NvcGUubmV3TWVtYmVyLnJvbGVfaWQpO1xuXG4gICAgICAgICAgICBMYWJlbFRyZWVVc2VyLmF0dGFjaChcbiAgICAgICAgICAgICAgICB7bGFiZWxfdHJlZV9pZDogTEFCRUxfVFJFRS5pZH0sXG4gICAgICAgICAgICAgICAge2lkOiBtZW1iZXIuaWQsIHJvbGVfaWQ6IG1lbWJlci5yb2xlX2lkfSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lbWJlckF0dGFjaGVkKG1lbWJlcik7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBoYW5kbGVFcnJvclxuICAgICAgICAgICAgKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBjb252ZXJ0IHJvbGUgSURzIHRvIHN0cmluZyBzbyB0aGV5IGNhbiBiZSBzZWxlY3RlZCBpbiBhIHNlbGVjdCBpbnB1dCBmaWVsZFxuICAgICAgICAvLyBhbHNvIGFkZCBpdCBhcyB0bXBfcm9sZV9pZCBzbyB0aGUgSUQgY2FuIGJlIHJlc2V0IGlmIHRoZSBjaGFuZ2UgZmFpbGVkXG4gICAgICAgIGZvciAodmFyIGkgPSBNRU1CRVJTLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBNRU1CRVJTW2ldLnRtcF9yb2xlX2lkID0gTUVNQkVSU1tpXS5yb2xlX2lkLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBSZXNvdXJjZSBmb3IgZmluZGluZyBsYWJlbHMgZnJvbSBhbiBleHRlcm5hbCBzb3VyY2UuXG4gKlxuICogdmFyIHJlc291cmNlID0gYmlpZ2xlLiRyZXF1aXJlKCdhcGkubGFiZWxTb3VyY2UnKTtcbiAqXG4gKiBGaW5kIGxhYmVsczpcbiAqXG4gKiByZXNvdXJjZS5xdWVyeSh7aWQ6IDEsIHF1ZXJ5OiAnS29sZ2EnfSkudGhlbiguLi4pO1xuICpcbiAqIEB0eXBlIHtWdWUucmVzb3VyY2V9XG4gKi9cbmJpaWdsZS4kZGVjbGFyZSgnYXBpLmxhYmVsU291cmNlJywgVnVlLnJlc291cmNlKCcvYXBpL3YxL2xhYmVsLXNvdXJjZXN7L2lkfS9maW5kJykpO1xuIiwiLyoqXG4gKiBSZXNvdXJjZSBmb3IgbGFiZWxzLlxuICpcbiAqIHZhciByZXNvdXJjZSA9IGJpaWdsZS4kcmVxdWlyZSgnYXBpLmxhYmVscycpO1xuICpcbiAqIENyZWF0ZSBhIGxhYmVsOlxuICpcbiAqIHJlc291cmNlLnNhdmUoe2xhYmVsX3RyZWVfaWQ6IDF9LCB7XG4gKiAgICAgbmFtZTogXCJUcmFzaFwiLFxuICogICAgIGNvbG9yOiAnYmFkYTU1J1xuICogfSkudGhlbiguLi4pO1xuICpcbiAqIERlbGV0ZSBhIGxhYmVsOlxuICpcbiAqIHJlc291cmNlLmRlbGV0ZSh7aWQ6IGxhYmVsSWR9KS50aGVuKC4uLik7XG4gKlxuICogQHR5cGUge1Z1ZS5yZXNvdXJjZX1cbiAqL1xuYmlpZ2xlLiRkZWNsYXJlKCdhcGkubGFiZWxzJywgVnVlLnJlc291cmNlKCcvYXBpL3YxL2xhYmVsc3svaWR9Jywge30sIHtcbiAgICBzYXZlOiB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICB1cmw6ICcvYXBpL3YxL2xhYmVsLXRyZWVzey9sYWJlbF90cmVlX2lkfS9sYWJlbHMnLFxuICAgIH1cbn0pKTtcbiIsIi8qKlxuICogQSBjb21wb25lbnQgdGhhdCBkaXNwbGF5cyBhIGxhYmVsIHRyZWUuIFRoZSBsYWJlbHMgY2FuIGJlIHNlYXJjaGVkIGFuZCBzZWxlY3RlZC5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5iaWlnbGUuJGNvbXBvbmVudCgnbGFiZWxUcmVlcy5jb21wb25lbnRzLmxhYmVsVHJlZScsIHtcbiAgICB0ZW1wbGF0ZTogJzxkaXYgY2xhc3M9XCJsYWJlbC10cmVlXCI+JyArXG4gICAgICAgICc8aDQgY2xhc3M9XCJsYWJlbC10cmVlX190aXRsZVwiIHYtaWY9XCJzaG93VGl0bGVcIj4nICtcbiAgICAgICAgICAgICc8YnV0dG9uIHYtaWY9XCJjb2xsYXBzaWJsZVwiIEBjbGljay5zdG9wPVwiY29sbGFwc2VcIiBjbGFzcz1cImJ0biBidG4tZGVmYXVsdCBidG4teHMgcHVsbC1yaWdodFwiIDp0aXRsZT1cImNvbGxhcHNlVGl0bGVcIj4nICtcbiAgICAgICAgICAgICAgICAnPHNwYW4gdi1pZj1cImNvbGxhcHNlZFwiIGNsYXNzPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLWRvd25cIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+JyArXG4gICAgICAgICAgICAgICAgJzxzcGFuIHYtZWxzZSBjbGFzcz1cImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi11cFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj4nICtcbiAgICAgICAgICAgICc8L2J1dHRvbj4nICtcbiAgICAgICAgICAgICd7e25hbWV9fScgK1xuICAgICAgICAnPC9oND4nICtcbiAgICAgICAgJzx1bCB2LWlmPVwiIWNvbGxhcHNlZFwiIGNsYXNzPVwibGFiZWwtdHJlZV9fbGlzdFwiPicgK1xuICAgICAgICAgICAgJzxsYWJlbC10cmVlLWxhYmVsIDpsYWJlbD1cImxhYmVsXCIgOmRlbGV0YWJsZT1cImRlbGV0YWJsZVwiIHYtZm9yPVwibGFiZWwgaW4gcm9vdExhYmVsc1wiIEBzZWxlY3Q9XCJlbWl0U2VsZWN0XCIgQGRlc2VsZWN0PVwiZW1pdERlc2VsZWN0XCIgQGRlbGV0ZT1cImVtaXREZWxldGVcIj48L2xhYmVsLXRyZWUtbGFiZWw+JyArXG4gICAgICAgICc8L3VsPicgK1xuICAgICc8L2Rpdj4nLFxuICAgIGRhdGE6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbGxhcHNlZDogZmFsc2VcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgbGFiZWxUcmVlTGFiZWw6IGJpaWdsZS4kcmVxdWlyZSgnbGFiZWxUcmVlcy5jb21wb25lbnRzLmxhYmVsVHJlZUxhYmVsJyksXG4gICAgfSxcbiAgICBwcm9wczoge1xuICAgICAgICBuYW1lOiB7XG4gICAgICAgICAgICB0eXBlOiBTdHJpbmcsXG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgbGFiZWxzOiB7XG4gICAgICAgICAgICB0eXBlOiBBcnJheSxcbiAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBzaG93VGl0bGU6IHtcbiAgICAgICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBzdGFuZGFsb25lOiB7XG4gICAgICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIGNvbGxhcHNpYmxlOiB7XG4gICAgICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgbXVsdGlzZWxlY3Q6IHtcbiAgICAgICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgZGVsZXRhYmxlOiB7XG4gICAgICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgIH1cbiAgICB9LFxuICAgIGNvbXB1dGVkOiB7XG4gICAgICAgIGxhYmVsTWFwOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbWFwID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5sYWJlbHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBtYXBbdGhpcy5sYWJlbHNbaV0uaWRdID0gdGhpcy5sYWJlbHNbaV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBtYXA7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbXBpbGVkTGFiZWxzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY29tcGlsZWQgPSB7fTtcbiAgICAgICAgICAgIHZhciBwYXJlbnQ7XG4gICAgICAgICAgICAvLyBDcmVhdGUgZGF0YXN0cnVjdHVyZSB0aGF0IG1hcHMgbGFiZWwgSURzIHRvIHRoZSBjaGlsZCBsYWJlbHMuXG4gICAgICAgICAgICAvLyBHbyBmcm9tIDAgdG8gbGVuZ3RoIHNvIHRoZSBsYWJlbHMgYXJlIGtlcHQgaW4gb3JkZXIuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gdGhpcy5sYWJlbHMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBwYXJlbnQgPSB0aGlzLmxhYmVsc1tpXS5wYXJlbnRfaWQ7XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBpbGVkLmhhc093blByb3BlcnR5KHBhcmVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGlsZWRbcGFyZW50XS5wdXNoKHRoaXMubGFiZWxzW2ldKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb21waWxlZFtwYXJlbnRdID0gW3RoaXMubGFiZWxzW2ldXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgbGFiZWwgY2hpbGRyZW4gd2l0aCB0aGUgY29tcGlsZWQgZGF0YXN0cnVjdHVyZVxuICAgICAgICAgICAgZm9yIChpID0gdGhpcy5sYWJlbHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoY29tcGlsZWQuaGFzT3duUHJvcGVydHkodGhpcy5sYWJlbHNbaV0uaWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIFZ1ZS5zZXQodGhpcy5sYWJlbHNbaV0sICdjaGlsZHJlbicsIGNvbXBpbGVkW3RoaXMubGFiZWxzW2ldLmlkXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgVnVlLnNldCh0aGlzLmxhYmVsc1tpXSwgJ2NoaWxkcmVuJywgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGxhc3QgY2hpbGQgd2FzIGRlbGV0ZWQsIGNsb3NlIHRoZSBsYWJlbC5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sYWJlbHNbaV0ub3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNvbXBpbGVkO1xuICAgICAgICB9LFxuICAgICAgICByb290TGFiZWxzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb21waWxlZExhYmVsc1tudWxsXTtcbiAgICAgICAgfSxcbiAgICAgICAgY29sbGFwc2VUaXRsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29sbGFwc2VkID8gJ0V4cGFuZCcgOiAnQ29sbGFwc2UnO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIGhhc0xhYmVsOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxhYmVsTWFwLmhhc093blByb3BlcnR5KGlkKTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0TGFiZWw6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFiZWxNYXBbaWRdO1xuICAgICAgICB9LFxuICAgICAgICBnZXRQYXJlbnRzOiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnRzID0gW107XG4gICAgICAgICAgICB3aGlsZSAobGFiZWwucGFyZW50X2lkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbGFiZWwgPSB0aGlzLmdldExhYmVsKGxhYmVsLnBhcmVudF9pZCk7XG4gICAgICAgICAgICAgICAgcGFyZW50cy51bnNoaWZ0KGxhYmVsLmlkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHBhcmVudHM7XG4gICAgICAgIH0sXG4gICAgICAgIGVtaXRTZWxlY3Q6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgnc2VsZWN0JywgbGFiZWwpO1xuICAgICAgICB9LFxuICAgICAgICBlbWl0RGVzZWxlY3Q6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgnZGVzZWxlY3QnLCBsYWJlbCk7XG4gICAgICAgIH0sXG4gICAgICAgIGVtaXREZWxldGU6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgnZGVsZXRlJywgbGFiZWwpO1xuICAgICAgICB9LFxuICAgICAgICBzZWxlY3RMYWJlbDogZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMubXVsdGlzZWxlY3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyU2VsZWN0ZWRMYWJlbHMoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVGhlIHNlbGVjdGVkIGxhYmVsIGRvZXMgbm90IG5lc3NlY2FyaWx5IGJlbG9uZyB0byB0aGlzIGxhYmVsIHRyZWUgc2luY2VcbiAgICAgICAgICAgIC8vIHRoZSB0cmVlIG1heSBiZSBkaXNwbGF5ZWQgaW4gYSBsYWJlbC10cmVlcyBjb21wb25lbnQgd2l0aCBvdGhlciB0cmVlcy5cbiAgICAgICAgICAgIGlmICh0aGlzLmhhc0xhYmVsKGxhYmVsLmlkKSkge1xuICAgICAgICAgICAgICAgIGxhYmVsLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbGxhcHNlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHZhciBwYXJlbnRzID0gdGhpcy5nZXRQYXJlbnRzKGxhYmVsKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gcGFyZW50cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldExhYmVsKHBhcmVudHNbaV0pLm9wZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZGVzZWxlY3RMYWJlbDogZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5oYXNMYWJlbChsYWJlbC5pZCkpIHtcbiAgICAgICAgICAgICAgICBsYWJlbC5zZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjbGVhclNlbGVjdGVkTGFiZWxzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5sYWJlbHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxhYmVsc1tpXS5zZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjb2xsYXBzZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5jb2xsYXBzZWQgPSAhdGhpcy5jb2xsYXBzZWQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGNyZWF0ZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gU2V0IHRoZSBsYWJlbCBwcm9wZXJ0aWVzXG4gICAgICAgIGZvciAoaSA9IHRoaXMubGFiZWxzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBWdWUuc2V0KHRoaXMubGFiZWxzW2ldLCAnb3BlbicsIGZhbHNlKTtcbiAgICAgICAgICAgIFZ1ZS5zZXQodGhpcy5sYWJlbHNbaV0sICdzZWxlY3RlZCcsIGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBsYWJlbCB0cmVlIGNhbiBiZSB1c2VkIGluIGEgbGFiZWwtdHJlZXMgY29tcG9uZW50IG9yIGFzIGEgc2luZ2xlIGxhYmVsXG4gICAgICAgIC8vIHRyZWUuIEluIGEgbGFiZWwtdHJlZXMgY29tcG9uZW50IG9ubHkgb25lIGxhYmVsIGNhbiBiZSBzZWxlY3RlZCBpbiBhbGwgbGFiZWxcbiAgICAgICAgLy8gdHJlZXMgc28gdGhlIHBhcmVudCBoYW5kbGVzIHRoZSBldmVudC4gQSBzaW5nbGUgbGFiZWwgdHJlZSBoYW5kbGVzIHRoZSBldmVudFxuICAgICAgICAvLyBieSBpdHNlbGYuXG4gICAgICAgIGlmICh0aGlzLnN0YW5kYWxvbmUpIHtcbiAgICAgICAgICAgIHRoaXMuJG9uKCdzZWxlY3QnLCB0aGlzLnNlbGVjdExhYmVsKTtcbiAgICAgICAgICAgIHRoaXMuJG9uKCdkZXNlbGVjdCcsIHRoaXMuZGVzZWxlY3RMYWJlbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRwYXJlbnQuJG9uKCdzZWxlY3QnLCB0aGlzLnNlbGVjdExhYmVsKTtcbiAgICAgICAgICAgIHRoaXMuJHBhcmVudC4kb24oJ2Rlc2VsZWN0JywgdGhpcy5kZXNlbGVjdExhYmVsKTtcbiAgICAgICAgICAgIHRoaXMuJHBhcmVudC4kb24oJ2NsZWFyJywgdGhpcy5jbGVhclNlbGVjdGVkTGFiZWxzKTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuIiwiLyoqXG4gKiBBIGNvbXBvbmVudCB0aGF0IGRpc3BsYXlzIGEgc2luZ2xlIGxhYmVsIG9mIGEgbGFiZWwgdHJlZS5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5iaWlnbGUuJGNvbXBvbmVudCgnbGFiZWxUcmVlcy5jb21wb25lbnRzLmxhYmVsVHJlZUxhYmVsJywge1xuICAgIG5hbWU6ICdsYWJlbC10cmVlLWxhYmVsJyxcbiAgICB0ZW1wbGF0ZTogJzxsaSBjbGFzcz1cImxhYmVsLXRyZWUtbGFiZWwgY2ZcIiA6Y2xhc3M9XCJjbGFzc09iamVjdFwiPicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cImxhYmVsLXRyZWUtbGFiZWxfX25hbWVcIiBAY2xpY2s9XCJ0b2dnbGVPcGVuXCI+JyArXG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJsYWJlbC10cmVlLWxhYmVsX19jb2xvclwiIDpzdHlsZT1cImNvbG9yU3R5bGVcIj48L3NwYW4+JyArXG4gICAgICAgICAgICAnPHNwYW4gdi10ZXh0PVwibGFiZWwubmFtZVwiIEBjbGljay5zdG9wPVwidG9nZ2xlU2VsZWN0XCI+PC9zcGFuPicgK1xuICAgICAgICAgICAgJzxzcGFuIHYtaWY9XCJzaG93RmF2b3VyaXRlXCIgY2xhc3M9XCJsYWJlbC10cmVlLWxhYmVsX19mYXZvdXJpdGVcIiBAY2xpY2suc3RvcD1cInRvZ2dsZUZhdm91cml0ZVwiPicgK1xuICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImdseXBoaWNvblwiIDpjbGFzcz1cImZhdm91cml0ZUNsYXNzXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCIgdGl0bGU9XCJcIj48L3NwYW4+JyArXG4gICAgICAgICAgICAnPC9zcGFuPicgK1xuICAgICAgICAgICAgJzxidXR0b24gdi1pZj1cImRlbGV0YWJsZVwiIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImNsb3NlIGxhYmVsLXRyZWUtbGFiZWxfX2RlbGV0ZVwiIDp0aXRsZT1cImRlbGV0ZVRpdGxlXCIgQGNsaWNrLnN0b3A9XCJkZWxldGVUaGlzXCI+PHNwYW4gYXJpYS1oaWRkZW49XCJ0cnVlXCI+JnRpbWVzOzwvc3Bhbj48L2J1dHRvbj4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPHVsIHYtaWY9XCJsYWJlbC5vcGVuXCIgY2xhc3M9XCJsYWJlbC10cmVlX19saXN0XCI+JyArXG4gICAgICAgICAgICAnPGxhYmVsLXRyZWUtbGFiZWwgOmxhYmVsPVwiY2hpbGRcIiA6ZGVsZXRhYmxlPVwiZGVsZXRhYmxlXCIgdi1mb3I9XCJjaGlsZCBpbiBsYWJlbC5jaGlsZHJlblwiIEBzZWxlY3Q9XCJlbWl0U2VsZWN0XCIgQGRlc2VsZWN0PVwiZW1pdERlc2VsZWN0XCIgQGRlbGV0ZT1cImVtaXREZWxldGVcIj48L2xhYmVsLXRyZWUtbGFiZWw+JyArXG4gICAgICAgICc8L3VsPicgK1xuICAgICc8L2xpPicsXG4gICAgZGF0YTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmF2b3VyaXRlOiBmYWxzZVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgcHJvcHM6IHtcbiAgICAgICAgbGFiZWw6IHtcbiAgICAgICAgICAgIHR5cGU6IE9iamVjdCxcbiAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBzaG93RmF2b3VyaXRlOiB7XG4gICAgICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICBkZWxldGFibGU6IHtcbiAgICAgICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgY2xhc3NPYmplY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgJ2xhYmVsLXRyZWUtbGFiZWwtLXNlbGVjdGVkJzogdGhpcy5sYWJlbC5zZWxlY3RlZCxcbiAgICAgICAgICAgICAgICAnbGFiZWwtdHJlZS1sYWJlbC0tZXhwYW5kYWJsZSc6IHRoaXMubGFiZWwuY2hpbGRyZW4sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICBjb2xvclN0eWxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogJyMnICsgdGhpcy5sYWJlbC5jb2xvclxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgZmF2b3VyaXRlQ2xhc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgJ2dseXBoaWNvbi1zdGFyLWVtcHR5JzogIXRoaXMuZmF2b3VyaXRlLFxuICAgICAgICAgICAgICAgICdnbHlwaGljb24tc3Rhcic6IHRoaXMuZmF2b3VyaXRlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgZGVsZXRlVGl0bGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAnUmVtb3ZlIGxhYmVsICcgKyB0aGlzLmxhYmVsLm5hbWU7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgdG9nZ2xlU2VsZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMubGFiZWwuc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiRlbWl0KCdzZWxlY3QnLCB0aGlzLmxhYmVsKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kZW1pdCgnZGVzZWxlY3QnLCB0aGlzLmxhYmVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gYSBtZXRob2QgY2FsbGVkICdkZWxldGUnIGRpZG4ndCB3b3JrXG4gICAgICAgIGRlbGV0ZVRoaXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdERlbGV0ZSh0aGlzLmxhYmVsKTtcbiAgICAgICAgfSxcbiAgICAgICAgdG9nZ2xlT3BlbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gSWYgdGhlIGxhYmVsIGNhbm5vdCBiZSBvcGVuZWQsIGl0IHdpbGwgYmUgc2VsZWN0ZWQgaGVyZSBpbnN0ZWFkLlxuICAgICAgICAgICAgaWYgKCF0aGlzLmxhYmVsLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTZWxlY3QoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYWJlbC5vcGVuID0gIXRoaXMubGFiZWwub3BlbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdG9nZ2xlRmF2b3VyaXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmZhdm91cml0ZSA9ICF0aGlzLmZhdm91cml0ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW1pdFNlbGVjdDogZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICAvLyBidWJibGUgdGhlIGV2ZW50IHVwd2FyZHNcbiAgICAgICAgICAgIHRoaXMuJGVtaXQoJ3NlbGVjdCcsIGxhYmVsKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW1pdERlc2VsZWN0OiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIC8vIGJ1YmJsZSB0aGUgZXZlbnQgdXB3YXJkc1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgnZGVzZWxlY3QnLCBsYWJlbCk7XG4gICAgICAgIH0sXG4gICAgICAgIGVtaXREZWxldGU6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgLy8gYnViYmxlIHRoZSBldmVudCB1cHdhcmRzXG4gICAgICAgICAgICB0aGlzLiRlbWl0KCdkZWxldGUnLCBsYWJlbCk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcbiIsIi8qKlxuICogQSBjb21wb25lbnQgdGhhdCBkaXNwbGF5cyBhIGxpc3Qgb2YgbGFiZWwgdHJlZXMuXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuYmlpZ2xlLiRjb21wb25lbnQoJ2xhYmVsVHJlZXMuY29tcG9uZW50cy5sYWJlbFRyZWVzJywge1xuICAgIHRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cImxhYmVsLXRyZWVzXCI+JyArXG4gICAgICAgICc8ZGl2IHYtaWY9XCJ0eXBlYWhlYWQgfHwgY2xlYXJhYmxlXCIgY2xhc3M9XCJsYWJlbC10cmVlc19faGVhZFwiPicgK1xuICAgICAgICAgICAgJzxidXR0b24gdi1pZj1cImNsZWFyYWJsZVwiIEBjbGljaz1cImNsZWFyXCIgY2xhc3M9XCJidG4gYnRuLWRlZmF1bHRcIiB0aXRsZT1cIkNsZWFyIHNlbGVjdGVkIGxhYmVsc1wiPjxzcGFuIGNsYXNzPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1yZW1vdmVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+PC9idXR0b24+JyArXG4gICAgICAgICAgICAnPGxhYmVsLXR5cGVhaGVhZCB2LWlmPVwidHlwZWFoZWFkXCIgOmxhYmVscz1cImxhYmVsc1wiIEBzZWxlY3Q9XCJoYW5kbGVTZWxlY3RcIj48L2xhYmVsLXR5cGVhaGVhZD4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cImxhYmVsLXRyZWVzX19ib2R5XCI+JyArXG4gICAgICAgICAgICAnPGxhYmVsLXRyZWUgOm5hbWU9XCJ0cmVlLm5hbWVcIiA6bGFiZWxzPVwidHJlZS5sYWJlbHNcIiA6bXVsdGlzZWxlY3Q9XCJtdWx0aXNlbGVjdFwiIHYtZm9yPVwidHJlZSBpbiB0cmVlc1wiIEBzZWxlY3Q9XCJoYW5kbGVTZWxlY3RcIiBAZGVzZWxlY3Q9XCJoYW5kbGVEZXNlbGVjdFwiPjwvbGFiZWwtdHJlZT4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICc8L2Rpdj4nLFxuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgbGFiZWxUeXBlYWhlYWQ6IGJpaWdsZS4kcmVxdWlyZSgnbGFiZWxUcmVlcy5jb21wb25lbnRzLmxhYmVsVHlwZWFoZWFkJyksXG4gICAgICAgIGxhYmVsVHJlZTogYmlpZ2xlLiRyZXF1aXJlKCdsYWJlbFRyZWVzLmNvbXBvbmVudHMubGFiZWxUcmVlJyksXG4gICAgfSxcbiAgICBwcm9wczoge1xuICAgICAgICB0cmVlczoge1xuICAgICAgICAgICAgdHlwZTogQXJyYXksXG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgdHlwZWFoZWFkOiB7XG4gICAgICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgY2xlYXJhYmxlOiB7XG4gICAgICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgbXVsdGlzZWxlY3Q6IHtcbiAgICAgICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgLy8gQWxsIGxhYmVscyBvZiBhbGwgbGFiZWwgdHJlZXMgaW4gYSBmbGF0IGxpc3QuXG4gICAgICAgIGxhYmVsczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGxhYmVscyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMudHJlZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShsYWJlbHMsIHRoaXMudHJlZXNbaV0ubGFiZWxzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGxhYmVscztcbiAgICAgICAgfVxuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICBoYW5kbGVTZWxlY3Q6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgnc2VsZWN0JywgbGFiZWwpO1xuICAgICAgICB9LFxuICAgICAgICBoYW5kbGVEZXNlbGVjdDogZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLiRlbWl0KCdkZXNlbGVjdCcsIGxhYmVsKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2xlYXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuJGVtaXQoJ2NsZWFyJyk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcbiIsIi8qKlxuICogQSBjb21wb25lbnQgdGhhdCBkaXNwbGF5cyBhIHR5cGVhaGVhZCB0byBmaW5kIGxhYmVscy5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5iaWlnbGUuJGNvbXBvbmVudCgnbGFiZWxUcmVlcy5jb21wb25lbnRzLmxhYmVsVHlwZWFoZWFkJywge1xuICAgIHRlbXBsYXRlOiAnPHR5cGVhaGVhZCBjbGFzcz1cImxhYmVsLXR5cGVhaGVhZCBjbGVhcmZpeFwiIDpkYXRhPVwibGFiZWxzXCIgOnBsYWNlaG9sZGVyPVwicGxhY2Vob2xkZXJcIiA6b24taGl0PVwic2VsZWN0TGFiZWxcIiA6dGVtcGxhdGU9XCJ0ZW1wbGF0ZVwiIDpkaXNhYmxlZD1cImRpc2FibGVkXCIgOnZhbHVlPVwidmFsdWVcIiBtYXRjaC1wcm9wZXJ0eT1cIm5hbWVcIj48L3R5cGVhaGVhZD4nLFxuICAgIGRhdGE6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRlbXBsYXRlOiAne3tpdGVtLm5hbWV9fScsXG4gICAgICAgIH07XG4gICAgfSxcbiAgICBjb21wb25lbnRzOiB7XG4gICAgICAgIHR5cGVhaGVhZDogVnVlU3RyYXAudHlwZWFoZWFkLFxuICAgIH0sXG4gICAgcHJvcHM6IHtcbiAgICAgICAgbGFiZWxzOiB7XG4gICAgICAgICAgICB0eXBlOiBBcnJheSxcbiAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBwbGFjZWhvbGRlcjoge1xuICAgICAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICAgICAgZGVmYXVsdDogJ0xhYmVsIG5hbWUnLFxuICAgICAgICB9LFxuICAgICAgICBkaXNhYmxlZDoge1xuICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICAgICAgZGVmYXVsdDogJycsXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIHNlbGVjdExhYmVsOiBmdW5jdGlvbiAobGFiZWwsIHR5cGVhaGVhZCkge1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgnc2VsZWN0JywgbGFiZWwpO1xuICAgICAgICAgICAgdHlwZWFoZWFkLnJlc2V0KCk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcbiIsIi8qKlxuICogQSBjb21wb25lbnQgZm9yIGEgZm9ybSB0byBtYW51YWxseSBjcmVhdGUgYSBuZXcgbGFiZWwgZm9yIGEgbGFiZWwgdHJlZVxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbmJpaWdsZS4kY29tcG9uZW50KCdsYWJlbFRyZWVzLmNvbXBvbmVudHMubWFudWFsTGFiZWxGb3JtJywge1xuICAgIG1peGluczogW2JpaWdsZS4kcmVxdWlyZSgnbGFiZWxUcmVlcy5taXhpbnMubGFiZWxGb3JtQ29tcG9uZW50JyldLFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgc3VibWl0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbGFiZWwgPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogdGhpcy5zZWxlY3RlZE5hbWUsXG4gICAgICAgICAgICAgICAgY29sb3I6IHRoaXMuc2VsZWN0ZWRDb2xvcixcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnBhcmVudCkge1xuICAgICAgICAgICAgICAgIGxhYmVsLnBhcmVudF9pZCA9IHRoaXMucGFyZW50LmlkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLiRlbWl0KCdzdWJtaXQnLCBsYWJlbCk7XG4gICAgICAgIH1cbiAgICB9LFxufSk7XG4iLCIvKipcbiAqIEEgY29tcG9uZW50IGZvciBhIGZvcm0gdG8gbWFudWFsbHkgY3JlYXRlIGEgbmV3IGxhYmVsIGZvciBhIGxhYmVsIHRyZWVcbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5iaWlnbGUuJGNvbXBvbmVudCgnbGFiZWxUcmVlcy5jb21wb25lbnRzLndvcm1zTGFiZWxGb3JtJywge1xuICAgIG1peGluczogW2JpaWdsZS4kcmVxdWlyZSgnbGFiZWxUcmVlcy5taXhpbnMubGFiZWxGb3JtQ29tcG9uZW50JyldLFxuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgd29ybXNSZXN1bHRJdGVtOiBiaWlnbGUuJHJlcXVpcmUoJ2xhYmVsVHJlZXMuY29tcG9uZW50cy53b3Jtc1Jlc3VsdEl0ZW0nKSxcbiAgICB9LFxuICAgIGRhdGE6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3VsdHM6IFtdLFxuICAgICAgICAgICAgcmVjdXJzaXZlOiBmYWxzZSxcbiAgICAgICAgICAgIGhhc1NlYXJjaGVkOiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGNvbXB1dGVkOiB7XG4gICAgICAgIGhhc1Jlc3VsdHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc3VsdHMubGVuZ3RoID4gMDtcbiAgICAgICAgfSxcbiAgICAgICAgcmVjdXJzaXZlQnV0dG9uQ2xhc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgYWN0aXZlOiB0aGlzLnJlY3Vyc2l2ZSxcbiAgICAgICAgICAgICAgICAnYnRuLXByaW1hcnknOiB0aGlzLnJlY3Vyc2l2ZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgc3VibWl0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyB0aGlzLiRlbWl0KCdzdWJtaXQnKTtcbiAgICAgICAgfSxcbiAgICAgICAgZmluZE5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB3b3JtcyA9IGJpaWdsZS4kcmVxdWlyZSgnbGFiZWxUcmVlcy53b3Jtc0xhYmVsU291cmNlJyk7XG4gICAgICAgICAgICB2YXIgbGFiZWxTb3VyY2UgPSBiaWlnbGUuJHJlcXVpcmUoJ2FwaS5sYWJlbFNvdXJjZScpO1xuICAgICAgICAgICAgdmFyIG1lc3NhZ2VzID0gYmlpZ2xlLiRyZXF1aXJlKCdtZXNzYWdlcy5zdG9yZScpO1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgnbG9hZC1zdGFydCcpO1xuXG4gICAgICAgICAgICBsYWJlbFNvdXJjZS5xdWVyeSh7aWQ6IHdvcm1zLmlkLCBxdWVyeTogdGhpcy5zZWxlY3RlZE5hbWV9KVxuICAgICAgICAgICAgICAgIC50aGVuKHRoaXMudXBkYXRlUmVzdWx0cywgbWVzc2FnZXMuaGFuZGxlRXJyb3JSZXNwb25zZSlcbiAgICAgICAgICAgICAgICAuZmluYWxseShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuaGFzU2VhcmNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRlbWl0KCdsb2FkLWZpbmlzaCcpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB1cGRhdGVSZXN1bHRzOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHRoaXMucmVzdWx0cyA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIH0sXG4gICAgICAgIGltcG9ydEl0ZW06IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICB2YXIgd29ybXMgPSBiaWlnbGUuJHJlcXVpcmUoJ2xhYmVsVHJlZXMud29ybXNMYWJlbFNvdXJjZScpO1xuXG4gICAgICAgICAgICB2YXIgbGFiZWwgPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgIGNvbG9yOiB0aGlzLnNlbGVjdGVkQ29sb3IsXG4gICAgICAgICAgICAgICAgc291cmNlX2lkOiBpdGVtLmFwaGlhX2lkLFxuICAgICAgICAgICAgICAgIGxhYmVsX3NvdXJjZV9pZDogd29ybXMuaWQsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAodGhpcy5yZWN1cnNpdmUpIHtcbiAgICAgICAgICAgICAgICBsYWJlbC5yZWN1cnNpdmUgPSAndHJ1ZSc7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgbGFiZWwucGFyZW50X2lkID0gdGhpcy5wYXJlbnQuaWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuJGVtaXQoJ3N1Ym1pdCcsIGxhYmVsKTtcbiAgICAgICAgfSxcbiAgICAgICAgdG9nZ2xlUmVjdXJzaXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnJlY3Vyc2l2ZSA9ICF0aGlzLnJlY3Vyc2l2ZTtcbiAgICAgICAgfVxuICAgIH0sXG59KTtcbiIsIi8qKlxuICogQW4gaXRlbSBvZiB0aGUgcmVzdWx0cyBsaXN0IG9mIGEgV29STVMgc2VhcmNoXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuYmlpZ2xlLiRjb21wb25lbnQoJ2xhYmVsVHJlZXMuY29tcG9uZW50cy53b3Jtc1Jlc3VsdEl0ZW0nLCB7XG4gICAgcHJvcHM6IHtcbiAgICAgICAgaXRlbToge1xuICAgICAgICAgICAgdHlwZTogT2JqZWN0LFxuICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHJlY3Vyc2l2ZToge1xuICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBsYWJlbHM6IHtcbiAgICAgICAgICAgIHR5cGU6IEFycmF5LFxuICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHBhcmVudDoge1xuICAgICAgICAgICAgdHlwZTogT2JqZWN0LFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbCxcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgY2xhc3NpZmljYXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLml0ZW0ucGFyZW50cy5qb2luKCcgPiAnKTtcbiAgICAgICAgfSxcbiAgICAgICAgYnV0dG9uVGl0bGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnJlY3Vyc2l2ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnQWRkICcgKyB0aGlzLml0ZW0ubmFtZSArICcgYW5kIGFsbCBXb1JNUyBwYXJlbnRzIGFzIG5ldyBsYWJlbHMnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ0FkZCAnICsgdGhpcy5pdGVtLm5hbWUgKyAnIGFzIGEgY2hpbGQgb2YgJyArIHRoaXMucGFyZW50Lm5hbWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAnQWRkICcgKyB0aGlzLml0ZW0ubmFtZSArICcgYXMgYSByb290IGxhYmVsJztcbiAgICAgICAgfSxcbiAgICAgICAgY2xhc3NPYmplY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgJ2xpc3QtZ3JvdXAtaXRlbS1zdWNjZXNzJzogdGhpcy5zZWxlY3RlZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0ZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHJldHVybiAhIXRoaXMubGFiZWxzLmZpbmQoZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhYmVsLnNvdXJjZV9pZCA9PSBzZWxmLml0ZW0uYXBoaWFfaWQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICBzZWxlY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5zZWxlY3RlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuJGVtaXQoJ3NlbGVjdCcsIHRoaXMuaXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfSxcbn0pO1xuIiwiLyoqXG4gKiBBIG1peGluIGZvciBjb21wb25lbnRzIHRoYXQgY3JlYXRlIG5ldyBsYWJlbHNcbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5iaWlnbGUuJGNvbXBvbmVudCgnbGFiZWxUcmVlcy5taXhpbnMubGFiZWxGb3JtQ29tcG9uZW50Jywge1xuICAgIHByb3BzOiB7XG4gICAgICAgIGxhYmVsczoge1xuICAgICAgICAgICAgdHlwZTogQXJyYXksXG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgY29sb3I6IHtcbiAgICAgICAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgICAgICAgIGRlZmF1bHQ6ICcnLFxuICAgICAgICB9LFxuICAgICAgICBwYXJlbnQ6IHtcbiAgICAgICAgICAgIHR5cGU6IE9iamVjdCxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGwsXG4gICAgICAgIH0sXG4gICAgICAgIG5hbWU6IHtcbiAgICAgICAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgICAgICAgIGRlZmF1bHQ6ICcnLFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgY29tcG9uZW50czoge1xuICAgICAgICBsYWJlbFR5cGVhaGVhZDogYmlpZ2xlLiRyZXF1aXJlKCdsYWJlbFRyZWVzLmNvbXBvbmVudHMubGFiZWxUeXBlYWhlYWQnKSxcbiAgICB9LFxuICAgIGNvbXB1dGVkOiB7XG4gICAgICAgIHNlbGVjdGVkQ29sb3I6IHtcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbG9yO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24gKGNvbG9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kZW1pdCgnY29sb3InLCBjb2xvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHNlbGVjdGVkTmFtZToge1xuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubmFtZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kZW1pdCgnbmFtZScsIG5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBzZWxlY3RlZFBhcmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50ID8gdGhpcy5wYXJlbnQubmFtZSA6ICcnO1xuICAgICAgICB9LFxuICAgICAgICBoYXNOb0xhYmVsczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFiZWxzLmxlbmd0aCA9PT0gMDtcbiAgICAgICAgfSxcbiAgICAgICAgaGFzTm9QYXJlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhdGhpcy5wYXJlbnQ7XG4gICAgICAgIH0sXG4gICAgICAgIGhhc05vTmFtZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICF0aGlzLm5hbWU7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgcmVmcmVzaENvbG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkQ29sb3IgPSBiaWlnbGUuJHJlcXVpcmUoJ2xhYmVsVHJlZXMucmFuZG9tQ29sb3InKSgpO1xuICAgICAgICB9LFxuICAgICAgICByZXNldFBhcmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgncGFyZW50JywgbnVsbCk7XG4gICAgICAgIH0sXG4gICAgICAgIHNlbGVjdExhYmVsOiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMuJGVtaXQoJ3BhcmVudCcsIGxhYmVsKTtcbiAgICAgICAgfSxcbiAgICB9LFxufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
