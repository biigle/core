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
            editing: true,
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
            createLabel: function () {
                if (this.loading) {
                    return;
                }

                this.loading = true;
                var self = this;
                var label = {
                    name: this.selectedName,
                    color: this.selectedColor,
                };

                if (this.selectedLabel) {
                    label.parent_id = this.selectedLabel.id;
                }

                labels.save({label_tree_id: labelTree.id}, label)
                    .then(this.labelCreated, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
            labelCreated: function (response) {
                this.insertLabel(response.data[0]);
                this.selectedColor = randomColor();
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
        submit: function () {
            this.$emit('submit');
        }
    },
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxhYmVsLXRyZWVzL21haW4uanMiLCJ2dWUvbGFiZWxUcmVlc0xhYmVscy5qcyIsInZ1ZS9yYW5kb21Db2xvci5qcyIsImxhYmVsLXRyZWVzL2NvbnRyb2xsZXJzL0F1dGhvcml6ZWRQcm9qZWN0c0NvbnRyb2xsZXIuanMiLCJsYWJlbC10cmVlcy9jb250cm9sbGVycy9MYWJlbFRyZWVDb250cm9sbGVyLmpzIiwibGFiZWwtdHJlZXMvY29udHJvbGxlcnMvTGFiZWxzQ29udHJvbGxlci5qcyIsImxhYmVsLXRyZWVzL2NvbnRyb2xsZXJzL01hbnVhbExhYmVsc0NvbnRyb2xsZXIuanMiLCJsYWJlbC10cmVlcy9jb250cm9sbGVycy9NZW1iZXJzQ29udHJvbGxlci5qcyIsImxhYmVsLXRyZWVzL2NvbnRyb2xsZXJzL1dvcm1zTGFiZWxzQ29udHJvbGxlci5qcyIsImxhYmVsLXRyZWVzL2RpcmVjdGl2ZXMvbGFiZWxUcmVlSXRlbS5qcyIsImxhYmVsLXRyZWVzL3NlcnZpY2VzL3JhbmRvbUNvbG9yLmpzIiwidnVlL2FwaS9sYWJlbHMuanMiLCJ2dWUvY29tcG9uZW50cy9sYWJlbFRyZWUuanMiLCJ2dWUvY29tcG9uZW50cy9sYWJlbFRyZWVMYWJlbC5qcyIsInZ1ZS9jb21wb25lbnRzL2xhYmVsVHlwZWFoZWFkLmpzIiwidnVlL2NvbXBvbmVudHMvbWFudWFsTGFiZWxGb3JtLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUEsUUFBQSxPQUFBLHNCQUFBLENBQUEsY0FBQTs7Ozs7O0FBTUEsUUFBQSxPQUFBLHNCQUFBLDRCQUFBLFVBQUEsa0JBQUE7SUFDQTs7SUFFQSxpQkFBQSxpQkFBQTs7Ozs7O0FDVkEsT0FBQSxXQUFBLHNCQUFBLFVBQUEsU0FBQTtJQUNBLElBQUEsU0FBQSxPQUFBLFNBQUE7SUFDQSxJQUFBLFdBQUEsT0FBQSxTQUFBO0lBQ0EsSUFBQSxjQUFBLE9BQUEsU0FBQTtJQUNBLElBQUEsWUFBQSxPQUFBLFNBQUE7O0lB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UUFHQSxJQUFBOztRQUVBLFFBQUE7WUFDQSxLQUFBO2dCQUNBLE1BQUEsQ0FBQSxJQUFBLElBQUEsSUFBQSxJQUFBLElBQUE7Z0JBQ0E7WUFDQSxLQUFBO2dCQUNBLE1BQUEsQ0FBQSxJQUFBLElBQUEsSUFBQSxJQUFBLElBQUE7Z0JBQ0E7WUFDQSxLQUFBO2dCQUNBLE1BQUEsQ0FBQSxJQUFBLElBQUEsSUFBQSxJQUFBLElBQUE7Z0JBQ0E7WUFDQSxLQUFBO2dCQUNBLE1BQUEsQ0FBQSxJQUFBLElBQUEsSUFBQSxJQUFBLElBQUE7Z0JBQ0E7WUFDQSxLQUFBO2dCQUNBLE1BQUEsQ0FBQSxJQUFBLElBQUEsSUFBQSxJQUFBLElBQUE7Z0JBQ0E7WUFDQTtnQkFDQSxNQUFBLENBQUEsSUFBQSxJQUFBLElBQUEsSUFBQSxJQUFBOzs7UUFHQSxPQUFBLElBQUEsSUFBQSxTQUFBLE1BQUE7WUFDQSxPQUFBLEtBQUEsTUFBQSxPQUFBOzs7O0lBSUEsSUFBQSxRQUFBLFVBQUEsS0FBQTtRQUNBLE9BQUEsSUFBQSxJQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUEsS0FBQSxTQUFBO1lBQ0EsT0FBQSxDQUFBLEtBQUEsV0FBQSxNQUFBLE1BQUEsUUFBQTs7OztJQUlBLE9BQUEsWUFBQTtRQUNBLElBQUEsUUFBQSxDQUFBLEdBQUEsR0FBQTtRQUNBLElBQUE7UUFDQSxLQUFBLElBQUEsSUFBQSxNQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtZQUNBLFlBQUEsS0FBQSxVQUFBO1lBQ0EsTUFBQSxLQUFBLENBQUEsSUFBQSxLQUFBLElBQUEsTUFBQSxLQUFBLFdBQUEsSUFBQTtZQUNBLElBQUEsY0FBQSxHQUFBO2dCQUNBLE1BQUEsS0FBQSxLQUFBLE1BQUEsTUFBQSxLQUFBLGFBQUE7bUJBQ0E7Z0JBQ0EsTUFBQSxLQUFBLEtBQUEsTUFBQSxNQUFBOzs7O1FBSUEsT0FBQSxNQUFBLE1BQUEsTUFBQSxRQUFBLEtBQUE7Ozs7Ozs7Ozs7O0FDOURBLFFBQUEsT0FBQSxzQkFBQSxXQUFBLHdJQUFBLFVBQUEsUUFBQSxZ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Q0E7Z0JBQ0EsSUFBQSxRQUFBO2dCQUNBLFNBQUEsWUFBQTtvQkFDQSxPQUFBLFNBQUE7b0JBQ0E7Ozs7UUFJQSxPQUFBLFlBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLE9BQUEsZ0JBQUEsWUFBQTtZQUNBLFVBQUEsQ0FBQTs7O1FBR0EsT0FBQSxXQUFBLFlBQUE7WUFDQSxPQUFBOzs7UUFHQSxPQUFBLGtCQUFBLFlBQUE7WUFDQSxPQUFBLFdBQUE7OztRQUdBLE9BQUEsVUFBQSxZQUFBO1lBQ0EsT0FBQSxXQUFBOzs7UUFHQSxPQUFBLGlCQUFBLFlBQUE7WUFDQSxPQUFBLFdBQUE7OztRQUdBLE9BQUEsY0FBQSxZQUFBO1lBQ0EsU0FBQTtZQUNBLFVBQUEsT0FBQTtnQkFDQSxJQUFBLFdBQUE7Z0JBQ0EsTUFBQSxPQUFBLGNBQUE7Z0JBQ0EsYUFBQSxPQUFBLGNBQUE7Z0JBQ0EsZUFBQSxTQUFBLE9BQUEsY0FBQTtlQUNBLGFBQUE7OztRQUdBLE9BQUEsaUJBQUEsWUFBQTtZQUNBLE9BQUEsY0FBQSxPQUFBLFdBQUE7WUFDQSxPQUFBLGNBQUEsY0FBQSxXQUFBO1lBQ0EsT0FBQSxjQUFBLGdCQUFBLFdBQUEsY0FBQTtZQUNBLFVBQUE7OztRQUdBLE9BQUEsYUFBQSxZQUFBO1lBQ0EsSUFBQSxRQUFBLGlEQUFBLFdBQUEsT0FBQSxNQUFBO2dCQUNBLFVBQUEsT0FBQSxDQUFBLElBQUEsV0FBQSxLQUFBLGFBQUEsSUFBQTs7OztRQUlBLE9BQUEsWUFBQSxVQUFBLFVBQUE7O1lBRUEsSUFBQSxRQUFBLGdEQUFBLFdBQUEsT0FBQSxNQUFBO2dCQUNBLGNBQUE7b0JBQ0EsQ0FBQSxlQUFBLFdBQUE7b0JBQ0EsQ0FBQSxJQUFBO29CQUNBLFlBQUE7d0JBQ0EsU0FBQTs7b0JBRUEsSUFBQTs7Ozs7Ozs7Ozs7Ozs7QUN0R0EsUUFBQSxPQUFBLHNCQUFBLFdBQUEsNkVBQUEsVUFBQSxRQUFBLFFBQUEsWUFBQSxPQUFBLEtBQUEsSUFBQTtRQUNBOztRQUVBLElBQUEsVUFBQTs7UUFFQSxJQUFBLFVBQUE7O1FB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QSxXQUFBLE9BQUEsU0FBQSxPQUFBO2dCQUNBLE9BQUE7Ozs7UUFJQSxPQUFBLGNBQUEsWUFBQTtZQUNBLE9BQUEsWUFBQSxTQUFBOzs7UUFHQSxPQUFBLGVBQUEsWUFBQTtZQUNBLE9BQUEsU0FBQSxRQUFBLFlBQUE7OztRQUdBLE9BQUEsWUFBQSxZQUFBO1lBQ0EsT0FBQSxTQUFBLE9BQUEsU0FBQTs7O1FBR0EsT0FBQSxjQUFBLFlBQUE7WUFDQSxPQUFBLE9BQUEsU0FBQSxTQUFBLFNBQUE7OztRQUdBLE9BQUEsZ0JBQUEsWUFBQTtZQUNBLE9BQUEsT0FBQSxTQUFBLFVBQUEsU0FBQTs7O1FBR0EsT0FBQSxXQUFBLFlBQUE7WUFDQSxJQUFBLFFBQUE7Z0JBQ0EsTUFBQSxPQUFBLFNBQUE7Z0JBQ0EsT0FBQSxPQUFBLFNBQUE7OztZQUdBLElBQUEsT0FBQSxTQUFBLE9BQUE7Z0JBQ0EsTUFBQSxZQUFBLE9BQUEsU0FBQSxNQUFBOzs7WUFHQSxPQUFBLFlBQUEsT0FBQSxLQUFBOzs7UUFHQSxPQUFBLElBQUEsbUJBQUEsVUFBQSxHQUFBLE9BQUE7WUFDQSxPQUFBLFNBQUEsUUFBQTtZQUNBLElBQUEsT0FBQTtnQkFDQSxPQUFBLFNBQUEsUUFBQSxNQUFBLE1BQUE7Ozs7Ozs7Ozs7Ozs7QUM1REEsUUFBQSxPQUFBLHNCQUFBLFdBQUEsZ0lBQUEsVUFBQSxRQUFBLFlBQUEsU0FBQSxPQUFBLGlCQUFBLFNBQUEsZUFBQSxLQUFBLE1BQUE7UUFDQTs7UUFFQSxJQUFBLFVBQUE7UUFDQSxJQUFBLFVBQUE7O1FBRUEsT0FBQSxZQUFBO1lBQ0EsTUFBQTtZQUNBLFNBQUEsZ0JBQUE7OztRQUdBLElBQUEsY0FBQSxVQUFBLFVBQUE7WUFDQSxJQUFBLGNBQUE7WUFDQSxVQUFBOzs7UUFHQSxJQUFBLGNBQUEsVUFBQSxRQUFBO1lBQ0EsT0FBQSxVQUFBLFNBQUEsT0FBQTtZQUNBLFVBQUE7OztRQUdBLElBQUEsbUJBQUEsVUFBQSxRQUFBLFVBQUE7WUFDQSxPQUFBLGNBQUEsT0FBQSxRQUFBO1lBQ0EsWUFBQTs7O1FBR0EsSUFBQSxnQkFBQSxVQUFBLFFBQUE7WUFDQSxLQUFBLElBQUEsSUFBQSxRQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtnQkFDQSxJQUFBLFFBQUEsR0FBQSxPQUFBLE9BQUEsSUFBQTtvQkFDQSxRQUFBLE9BQUEsR0FBQTtvQkFDQTs7O1lBR0EsVUFBQTs7O1FBR0EsSUFBQSxpQkFBQSxVQUFBLE1BQUE7WUFDQSxLQUFBLElBQUEsSUFBQSxRQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtnQkFDQSxJQUFBLFFBQUEsR0FBQSxPQUFBLEtBQUEsSUFBQTtvQkFDQSxPQUFBOzs7O1lBSUEsT0FBQTs7O1FBR0EsSUFBQSx5QkFBQSxVQUFBLE9BQUE7WUFDQSxPQUFBLE1BQUEsT0FBQTs7O1FBR0EsSUFBQSxpQkFBQSxVQUFBLFFBQUE7WUFDQSxPQUFBLGNBQUEsT0FBQSxRQUFBO1lBQ0EsUUFBQSxLQUFBO1lBQ0EsT0FBQSxVQUFBLE9BQUE7WUFDQSxVQUFBOzs7UUFHQSxPQUFBLFlBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLE9BQUEsZ0JBQUEsWUFBQTtZQUNBLFVBQUEsQ0FBQTs7O1FBR0EsT0FBQSxZQUFBLFlBQUE7WUFDQSxPQUFBOzs7UUFHQSxPQUFBLGFBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLE9BQUEsYUFBQSxZQUFBO1lBQ0EsT0FBQSxRQUFBLFNBQUE7OztRQUdBLE9BQUEsV0FBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsT0FBQSxVQUFBLFVBQUEsSUFBQTtZQUNBLE9BQUEsTUFBQTs7O1FBR0EsT0FBQSxZQUFBLFVBQUEsUUFBQTtZQUNBLE9BQUEsWUFBQSxPQUFBOzs7UUFHQSxPQUFBLGFBQUEsVUFBQSxRQUFBO1lBQ0EsVUFBQTtZQUNBLGNBQUE7Z0JBQ0EsQ0FBQSxlQUFBLFdBQUE7Z0JBQ0EsQ0FBQSxJQUFBLE9BQUEsSUFBQSxTQUFBLFNBQUEsT0FBQTtnQkFDQSxZQUFBO29CQUNBLFlBQUE7O2dCQUVBLFVBQUEsVUFBQTtvQkFDQSxpQkFBQSxRQUFBOzs7OztRQUtBLE9BQUEsZUFBQSxVQUFBLFFBQUE7WUFDQSxVQUFBO1lBQ0EsY0FBQTtnQkFDQSxDQUFBLGVBQUEsV0FBQTtnQkFDQSxDQUFBLElBQUEsT0FBQTtnQkFDQSxZQUFBO29CQUNBLGNBQUE7O2dCQUVBOzs7O1FBSUEsT0FBQSxXQUFBLFVBQUEsTUFBQTtZQUNBLElBQUEsUUFBQSxLQUFBLGFBQUEsS0FBQSxVQUFBO2dCQUNBLE9BQUEsS0FBQSxZQUFBLE1BQUEsS0FBQTs7O1lBR0EsT0FBQTs7O1FBR0EsT0FBQSxXQUFBLFVBQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxLQUFBLENBQUEsT0FBQSxtQkFBQSxTQUFBO2lCQUNBLEtBQUE7OztRQUdBLE9BQUEsaUJBQUEsWUFBQTtZQUNBLE9BQUEsT0FBQSxVQUFBO2dCQUNBLE9BQUEsVUFBQSxLQUFBLE9BQUE7Z0JBQ0EsZUFBQSxPQUFBLFVBQUE7Z0JBQ0EsT0FBQSxVQUFBLFlBQUE7OztRQUdBLE9BQUEsZUFBQSxZQUFBO1lBQ0EsSUFBQSxDQUFBLE9BQUEsa0JBQUE7O1lBRUEsVUFBQTtZQUNBLElBQUEsU0FBQSxPQUFBLFVBQUE7O1lBRUEsT0FBQSxVQUFBLFNBQUEsT0FBQSxVQUFBOztZQUVBLGNBQUE7Z0JBQ0EsQ0FBQSxlQUFBLFdBQUE7Z0JBQ0EsQ0FBQSxJQUFBLE9BQUEsSUFBQSxTQUFBLE9BQUE7Z0JBQ0EsWUFBQTtvQkFDQSxlQUFBOztnQkFFQTs7Ozs7O1FBTUEsS0FBQSxJQUFBLElBQUEsUUFBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7WUFDQSxRQUFBLEdBQUEsY0FBQSxRQUFBLEdBQUEsUUFBQTs7Ozs7Ozs7Ozs7O0FDNUpBLFFBQUEsT0FBQSxzQkFBQSxXQUFBLDBGQUFBLFVBQUEsUUFBQSxhQUFBLGVBQUEsS0FBQSxhQUFBO1FBQ0E7OztRQUdBLElBQUEsU0FBQSxDQUFBLFlBQUE7WUFDQSxLQUFBLElBQUEsSUFBQSxjQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtnQkFDQSxJQUFBLGNBQUEsR0FBQSxTQUFBLFNBQUE7b0JBQ0EsT0FBQSxjQUFBOzs7OztRQUtBLElBQUEsV0FBQTtZQUNBLE9BQUE7WUFDQSxNQUFBOzs7UUFHQSxJQUFBLGNBQUE7O1FBRUEsSUFBQSxVQUFBOzs7UUFHQSxJQUFBLFlBQUE7OztRQUdBLElBQUEsY0FBQTs7UUFFQSxJQUFBLGtCQUFBLFVBQUEsVUFBQTtZQUNBLFVBQUE7WUFDQSxPQUFBO1lBQ0EsSUFBQSxjQUFBOzs7UUFHQSxJQUFBLG9CQUFBLFlBQUE7WUFDQSxVQUFBO1lBQ0EsT0FBQTs7O1FBR0EsSUFBQSxpQkFBQSxVQUFBLFFBQUE7WUFDQSxLQUFBLElBQUEsSUFBQSxPQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtnQkFDQSxZQUFBLEtBQUEsU0FBQSxPQUFBLEdBQUE7Ozs7O1lBS0EsSUFBQSxDQUFBLE9BQUEsU0FBQSxTQUFBLENBQUEsTUFBQSxPQUFBLFNBQUEsTUFBQSxXQUFBLE9BQUEsU0FBQSxPQUFBO2dCQUNBLE9BQUE7Ozs7UUFJQSxPQUFBLFdBQUE7WUFDQSxPQUFBLFNBQUE7WUFDQSxPQUFBLFlBQUE7WUFDQSxNQUFBLFNBQUE7OztRQUdBLE9BQUEsaUJBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLE9BQUEsWUFBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsT0FBQSxpQkFBQSxZQUFBO1lBQ0EsT0FBQSxZQUFBLFNBQUE7OztRQUdBLE9BQUEsT0FBQSxZQUFBO1lBQ0EsVUFBQTtZQUNBLE9BQUE7WUFDQSxjQUFBLFlBQUE7Z0JBQ0EsQ0FBQSxJQUFBLE9BQUEsSUFBQSxPQUFBLE9BQUEsU0FBQTtnQkFDQTtnQkFDQTs7OztRQUlBLE9BQUEsb0JBQUEsVUFBQSxNQUFBO1lBQ0EsT0FBQSxLQUFBLFFBQUEsS0FBQTs7O1FBR0EsT0FBQSxjQUFBLFlBQUE7WUFDQSxPQUFBLFlBQUEsU0FBQTs7O1FBR0EsT0FBQSxlQUFBLFlBQUE7WUFDQSxPQUFBLFNBQUEsUUFBQSxZQUFBOzs7UUFHQSxPQUFBLGNBQUEsWUFBQTtZQUNBLE9BQUEsT0FBQSxTQUFBLFNBQUEs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QUEsSUFBQTs7O1lBR0EsSUFBQTs7WUFFQSxRQUFBO2dCQUNBLEtBQUE7b0JBQ0EsTUFBQSxDQUFBLElBQUEsSUFBQSxJQUFBLElBQUEsSUFBQTtvQkFDQTtnQkFDQSxLQUFBO29CQUNBLE1BQUEsQ0FBQSxJQUFBLElBQUEsSUFBQSxJQUFBLElBQUE7b0JBQ0E7Z0JBQ0EsS0FBQTtvQkFDQSxNQUFBLENBQUEsSUFBQSxJQUFBLElBQUEsSUFBQSxJQUFBO29CQUNBO2dCQUNBLEtBQUE7b0JBQ0EsTUFBQSxDQUFBLElBQUEsSUFBQSxJQUFBLElBQUEsSUFBQTtvQkFDQTtnQkFDQSxLQUFBO29CQUNBLE1BQUEsQ0FBQSxJQUFBLElBQUEsSUFBQSxJQUFBLElBQUE7b0JBQ0E7Z0JBQ0E7b0JBQ0EsTUFBQSxDQUFBLElBQUEsSUFBQSxJQUFBLElBQUEsSUFBQTs7O1lBR0EsT0FBQSxJQUFBLElBQUEsU0FBQSxNQUFBO2dCQUNBLE9BQUEsS0FBQSxNQUFBLE9BQUE7Ozs7UUFJQSxJQUFBLFFBQUEsVUFBQSxLQUFBO1lBQ0EsT0FBQSxJQUFBLElBQUEsVUFBQSxNQUFBO2dCQUNBLE9BQUEsS0FBQSxTQUFBO2dCQUNBLE9BQUEsQ0FBQSxLQUFBLFdBQUEsTUFBQSxNQUFBLFFBQUE7Ozs7UUFJQSxLQUFBLE1BQUEsWUFBQTtZQUNBLElBQUEsUUFBQSxDQUFBLEdBQUEsR0FBQTtZQUNBLElBQUE7WUFDQSxLQUFBLElBQUEsSUFBQSxNQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtnQkFDQSxZQUFBLEtBQUEsVUFBQTtnQkFDQSxNQUFBLEtBQUEsQ0FBQSxJQUFBLEtBQUEsSUFBQSxNQUFBLEtBQUEsV0FBQSxJQUFBO2dCQUNBLElBQUEsY0FBQSxHQUFBO29CQUNBLE1BQUEsS0FBQSxLQUFBLE1BQUEsTUFBQSxLQUFBLGFBQUE7dUJBQ0E7b0JBQ0EsTUFBQSxLQUFBLEtBQUEsTUFBQSxNQUFBOzs7O1lBSUEsT0FBQSxNQUFBLE1BQUEsTUFBQSxRQUFBLEtBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDMURBLE9BQUEsU0FBQSxjQUFBLElBQUEsU0FBQSx1QkFBQSxJQUFBO0lBQ0EsTUFBQTtRQUNBLFFBQUE7UUFDQSxLQUFBOzs7Ozs7Ozs7QUNoQkEsT0FBQSxXQUFBLG1DQUFBO0lBQ0EsVUFBQTtRQUNBO1lBQ0E7Z0JBQ0E7Z0JBQ0E7WUFDQTtZQUNBO1FBQ0E7UUFDQTtZQUNBO1FBQ0E7SUFDQTtJQUNBLE1BQUEsWUFBQTtRQUNBLE9BQUE7WUFDQSxXQUFBOzs7SUFHQSxZQUFBO1FBQ0EsZ0JBQUEsT0FBQSxTQUFBOztJQUVBLE9BQUE7UUFDQSxNQUFBO1lBQ0EsTUFBQTtZQUNBLFVBQUE7O1FBRUEsUUFBQTtZQUNBLE1BQUE7WUFDQSxVQUFBOztRQUVBLFdBQUE7WUFDQSxNQUFBO1lBQ0EsU0FBQTs7UUFFQSxZQUFBO1lBQ0EsTUFBQTtZQUNBLFNBQUE7O1FBRUEsYUFBQTtZQUNBLE1BQUE7WUFDQSxTQUFBOztRQUVBLGFBQUE7WUFDQSxNQUFBO1lBQ0EsU0FBQTs7UUFFQSxXQUFBO1lBQ0EsTUFBQTtZQUNBLFNBQUE7OztJQUdBLFVBQUE7UUFDQSxVQUFBLFlBQUE7WUFDQSxJQUFBLE1BQUE7WUFDQSxLQUFBLElBQUEsSUFBQSxLQUFBLE9BQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO2dCQUNBLElBQUEsS0FBQSxPQUFBLEdBQUEsTUFBQSxLQUFBLE9BQUE7OztZQUdBLE9BQUE7O1FBRUEsZ0JBQUEsWUFBQTtZQUNBLElBQUEsV0FBQTtZQUNBLElBQUE7OztZQUdBLEtBQUEsSUFBQSxJQUFBLEdBQUEsU0FBQSxLQUFBLE9BQUEsUUFBQSxJQUFBLFFBQUEsS0FBQTtnQkFDQSxTQUFBLEtBQUEsT0FBQSxHQUFBO2dCQUNBLElBQUEsU0FBQSxlQUFBLFNBQUE7b0JBQ0EsU0FBQSxRQUFBLEtBQUEsS0FBQSxPQUFBO3VCQUNBO29CQUNBLFNBQUEsVUFBQSxDQUFBLEtBQUEsT0FBQTs7Ozs7WUFLQSxLQUFBLElBQUEsS0FBQSxPQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtnQkFDQSxJQUFBLFNBQUEsZUFBQSxLQUFBLE9BQUEsR0FBQSxLQUFBO29CQUNBLElBQUEsSUFBQSxLQUFBLE9BQUEsSUFBQSxZQUFBLFNBQUEsS0FBQSxPQUFBLEdBQUE7dUJBQ0E7b0JBQ0EsSUFBQSxJQUFBLEtBQUEsT0FBQSxJQUFBLFlBQUE7Ozs7WUFJQSxPQUFBOztRQUVBLFlBQUEsWUFBQTtZQUNBLE9BQUEsS0FBQSxlQUFBOztRQUVBLGVBQUEsWUFBQTtZQUNBLE9BQUEsS0FBQSxZQUFBLFdBQUE7OztJQUdBLFNBQUE7UUFDQSxVQUFBLFVBQUEsSUFBQTtZQUNBLE9BQUEsS0FBQSxTQUFBLGVBQUE7O1FBRUEsVUFBQSxVQUFBLElBQUE7WUFDQSxPQUFBLEtBQUEsU0FBQTs7UUFFQSxZQUFBLFVBQUEsT0FBQTtZQUNBLElBQUEsVUFBQTtZQUNBLE9BQUEsTUFBQSxjQUFBLE1BQUE7Z0JBQ0EsUUFBQSxLQUFBLFNBQUEsTUFBQTtnQkFDQSxRQUFBLFFBQUEsTUFBQTs7O1lBR0EsT0FBQTs7UUFFQSxZQUFBLFVBQUEsT0FBQTtZQUNBLEtBQUEsTUFBQSxVQUFBOztRQUVBLGNBQUEsVUFBQSxPQUFBO1lBQ0EsS0FBQSxNQUFBLFlBQUE7O1FBRUEsWUFBQSxVQUFBLE9BQUE7WUFDQSxLQUFBLE1BQUEsVUFBQTs7UUFFQSxhQUFBLFVBQUEsT0FBQTtZQUNBLElBQUEsQ0FBQSxLQUFBLGFBQUE7Z0JBQ0EsS0FBQTs7Ozs7WUFLQSxJQUFBLEtBQUEsU0FBQSxNQUFBLEtBQUE7Z0JBQ0EsTUFBQSxXQUFBO2dCQUNBLEtBQUEsWUFBQTtnQkFDQSxJQUFBLFVBQUEsS0FBQSxXQUFBO2dCQUNBLEtBQUEsSUFBQSxJQUFBLFFBQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO29CQUNBLEtBQUEsU0FBQSxRQUFBLElBQUEsT0FBQTs7OztRQUlBLGVBQUEsVUFBQSxPQUFBO1lBQ0EsSUFBQSxLQUFBLFNBQUEsTUFBQSxLQUFBO2dCQUNBLE1BQUEsV0FBQTs7O1FBR0EscUJBQUEsWUFBQTtZQUNBLEtBQUEsSUFBQSxJQUFBLEtBQUEsT0FBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7Z0JBQ0EsS0FBQSxPQUFBLEdBQUEsV0FBQTs7O1FBR0EsVUFBQSxZQUFBO1lBQ0EsS0FBQSxZQUFBLENBQUEsS0FBQTs7O0lBR0EsU0FBQSxZQUFBOztRQUVBLEtBQUEsSUFBQSxLQUFBLE9BQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO1lBQ0EsSUFBQSxJQUFBLEtBQUEsT0FBQSxJQUFBLFFBQUE7WUFDQSxJQUFBLElBQUEsS0FBQSxPQUFBLElBQUEsWUFBQTs7Ozs7OztRQU9BLElBQUEsS0FBQSxZQUFBO1lBQ0EsS0FBQSxJQUFBLFVBQUEsS0FBQTtZQUNBLEtBQUEsSUFBQSxZQUFBLEtBQUE7ZUFDQTtZQUNBLEtBQUEsUUFBQSxJQUFBLFVBQUEsS0FBQTtZQUNBLEtBQUEsUUFBQSxJQUFBLFlBQUEsS0FBQTtZQUNBLEtBQUEsUUFBQSxJQUFBLFNBQUEsS0FBQTs7Ozs7Ozs7OztBQ3BLQSxPQUFBLFdBQUEsd0NBQUE7SUFDQSxNQUFBO0lBQ0EsVUFBQTtRQUNBO1lBQ0E7WUFDQTtZQUNBO2dCQUNBO1lBQ0E7WUFDQTtRQUNBO1FBQ0E7WUFDQTtRQUNBO0lBQ0E7SUFDQSxNQUFBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsV0FBQTs7O0lBR0EsT0FBQTtRQUNBLE9BQUE7WUFDQSxNQUFBO1lBQ0EsVUFBQTs7UUFFQSxlQUFBO1lBQ0EsTUFBQTtZQUNBLFVBQUE7O1FBRUEsV0FBQTtZQUNBLE1BQUE7WUFDQSxTQUFBOzs7SUFHQSxVQUFBO1FBQ0EsYUFBQSxZQUFBO1lBQ0EsT0FBQTtnQkFDQSw4QkFBQSxLQUFBLE1BQUE7Z0JBQ0EsZ0NBQUEsS0FBQSxNQUFBOzs7UUFHQSxZQUFBLFlBQUE7WUFDQSxPQUFBO2dCQUNBLG9CQUFBLE1BQUEsS0FBQSxNQUFBOzs7UUFHQSxnQkFBQSxZQUFBO1lBQ0EsT0FBQTtnQkFDQSx3QkFBQSxDQUFBLEtBQUE7Z0JBQ0Esa0JBQUEsS0FBQTs7O1FBR0EsYUFBQSxZQUFBO1lBQ0EsT0FBQSxrQkFBQSxLQUFBLE1BQUE7OztJQUdBLFNBQUE7UUFDQSxjQUFBLFlBQUE7WUFDQSxJQUFBLENBQUEsS0FBQSxNQUFBLFVBQUE7Z0JBQ0EsS0FBQSxNQUFBLFVBQUEsS0FBQTttQkFDQTtnQkFDQSxLQUFBLE1BQUEsWUFBQSxLQUFBOzs7O1FBSUEsWUFBQSxZQUFBO1lBQ0EsS0FBQSxXQUFBLEtBQUE7O1FBRUEsWUFBQSxZQUFBOztZQUVBLElBQUEsQ0FBQSxLQUFBLE1BQUEsVUFBQTtnQkFDQSxLQUFBO21CQUNBO2dCQUNBLEtBQUEsTUFBQSxPQUFBLENBQUEsS0FBQSxNQUFBOzs7UUFHQSxpQkFBQSxZQUFBO1lBQ0EsS0FBQSxZQUFBLENBQUEsS0FBQTs7UUFFQSxZQUFBLFVBQUEsT0FBQTs7WUFFQSxLQUFBLE1BQUEsVUFBQTs7UUFFQSxjQUFBLFVBQUEsT0FBQTs7WUFFQSxLQUFBLE1BQUEsWUFBQTs7UUFFQSxZQUFBLFVBQUEsT0FBQTs7WUFFQSxLQUFBLE1BQUEsVUFBQTs7Ozs7Ozs7OztBQ3pGQSxPQUFBLFdBQUEsd0NBQUE7SUFDQSxVQUFBO0lBQ0EsTUFBQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLFVBQUE7OztJQUdBLFlBQUE7UUFDQSxXQUFBLFNBQUE7O0lBRUEsT0FBQTtRQUNBLFFBQUE7WUFDQSxNQUFBO1lBQ0EsVUFBQTs7UUFFQSxhQUFBO1lBQ0EsTUFBQTtZQUNBLFNBQUE7O1FBRUEsVUFBQTtZQUNBLE1BQUE7WUFDQSxTQUFBOztRQUVBLE9BQUE7WUFDQSxNQUFBO1lBQ0EsU0FBQTs7O0lBR0EsU0FBQTtRQUNBLGFBQUEsVUFBQSxPQUFBLFdBQUE7WUFDQSxLQUFBLE1BQUEsVUFBQTtZQUNBLFVBQUE7Ozs7Ozs7Ozs7QUMvQkEsT0FBQSxXQUFBLHlDQUFBO0lBQ0EsT0FBQTtRQUNBLFFBQUE7WUFDQSxNQUFBO1lBQ0EsVUFBQTs7UUFFQSxPQUFBO1lBQ0EsTUFBQTtZQUNBLFNBQUE7O1FBRUEsUUFBQTtZQUNBLE1BQUE7WUFDQSxTQUFBOztRQUVBLE1BQUE7WUFDQSxNQUFBO1lBQ0EsU0FBQTs7O0lBR0EsWUFBQTtRQUNBLGdCQUFBLE9BQUEsU0FBQTs7SUFFQSxVQUFBO1FBQ0EsZUFBQTtZQUNBLEtBQUEsWUFBQTtnQkFDQSxPQUFBLEtBQUE7O1lBRUEsS0FBQSxVQUFBLE9BQUE7Z0JBQ0EsS0FBQSxNQUFBLFNBQUE7OztRQUdBLGNBQUE7WUFDQSxLQUFBLFlBQUE7Z0JBQ0EsT0FBQSxLQUFBOztZQUVBLEtBQUEsVUFBQSxNQUFBO2dCQUNBLEtBQUEsTUFBQSxRQUFBOzs7UUFHQSxnQkFBQSxZQUFBO1lBQ0EsT0FBQSxLQUFBLFNBQUEsS0FBQSxPQUFBLE9BQUE7O1FBRUEsYUFBQSxZQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUEsV0FBQTs7UUFFQSxhQUFBLFlBQUE7WUFDQSxPQUFBLENBQUEsS0FBQTs7UUFFQSxXQUFBLFlBQUE7WUFDQSxPQUFBLENBQUEsS0FBQTs7O0lBR0EsU0FBQTtRQUNBLGNBQUEsWUFBQTtZQUNBLEtBQUEsZ0JBQUEsT0FBQSxTQUFBOztRQUVBLGFBQUEsWUFBQTtZQUNBLEtBQUEsTUFBQSxVQUFBOztRQUVBLGFBQUEsVUFBQSxPQUFBO1lBQ0EsS0FBQSxNQUFBLFVBQUE7O1FBRUEsUUFBQSxZQUFBO1lBQ0EsS0FBQSxNQUFBOzs7O0FBSUEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBiaWlnbGUubGFiZWwtdHJlZXNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgQklJR0xFIGxhYmVsIHRyZWVzIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2JpaWdsZS5sYWJlbC10cmVlcycsIFsnYmlpZ2xlLmFwaScsICdiaWlnbGUudWknXSk7XG5cbi8qXG4gKiBEaXNhYmxlIGRlYnVnIGluZm8gaW4gcHJvZHVjdGlvbiBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlLlxuICogc2VlOiBodHRwczovL2NvZGUuYW5ndWxhcmpzLm9yZy8xLjQuNy9kb2NzL2d1aWRlL3Byb2R1Y3Rpb25cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2JpaWdsZS5sYWJlbC10cmVlcycpLmNvbmZpZyhmdW5jdGlvbiAoJGNvbXBpbGVQcm92aWRlcikge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgJGNvbXBpbGVQcm92aWRlci5kZWJ1Z0luZm9FbmFibGVkKGZhbHNlKTtcbn0pO1xuIiwiLyoqXG4gKiBUaGUgcGFuZWwgZm9yIGVkaXRpbmcgdGhlIGxhYmVscyBvZiBhIGxhYmVsIHRyZWVcbiAqL1xuYmlpZ2xlLiR2aWV3TW9kZWwoJ2xhYmVsLXRyZWVzLWxhYmVscycsIGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgdmFyIGxhYmVscyA9IGJpaWdsZS4kcmVxdWlyZSgnYXBpLmxhYmVscycpO1xuICAgIHZhciBtZXNzYWdlcyA9IGJpaWdsZS4kcmVxdWlyZSgnbWVzc2FnZXMuc3RvcmUnKTtcbiAgICB2YXIgcmFuZG9tQ29sb3IgPSBiaWlnbGUuJHJlcXVpcmUoJ2xhYmVsVHJlZXMucmFuZG9tQ29sb3InKTtcbiAgICB2YXIgbGFiZWxUcmVlID0gYmlpZ2xlLiRyZXF1aXJlKCdsYWJlbFRyZWVzLmxhYmVsVHJlZScpO1xuXG4gICAgbmV3IFZ1ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBlZGl0aW5nOiB0cnVlLFxuICAgICAgICAgICAgbG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICBsYWJlbHM6IGJpaWdsZS4kcmVxdWlyZSgnbGFiZWxUcmVlcy5sYWJlbHMnKSxcbiAgICAgICAgICAgIHNlbGVjdGVkQ29sb3I6IHJhbmRvbUNvbG9yKCksXG4gICAgICAgICAgICBzZWxlY3RlZExhYmVsOiBudWxsLFxuICAgICAgICAgICAgc2VsZWN0ZWROYW1lOiAnJyxcbiAgICAgICAgfSxcbiAgICAgICAgY29tcG9uZW50czoge1xuICAgICAgICAgICAgdHlwZWFoZWFkOiBWdWVTdHJhcC50eXBlYWhlYWQsXG4gICAgICAgICAgICB0YWJzOiBWdWVTdHJhcC50YWJzLFxuICAgICAgICAgICAgdGFiOiBWdWVTdHJhcC50YWIsXG4gICAgICAgICAgICBsYWJlbFRyZWU6IGJpaWdsZS4kcmVxdWlyZSgnbGFiZWxUcmVlcy5jb21wb25lbnRzLmxhYmVsVHJlZScpLFxuICAgICAgICAgICAgbWFudWFsTGFiZWxGb3JtOiBiaWlnbGUuJHJlcXVpcmUoJ2xhYmVsVHJlZXMuY29tcG9uZW50cy5tYW51YWxMYWJlbEZvcm0nKSxcbiAgICAgICAgfSxcbiAgICAgICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgICAgIGNsYXNzT2JqZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgJ3BhbmVsLXdhcm5pbmcnOiB0aGlzLmVkaXRpbmdcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgbWV0aG9kczoge1xuICAgICAgICAgICAgdG9nZ2xlRWRpdGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZWRpdGluZyA9ICF0aGlzLmVkaXRpbmc7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmluaXNoTG9hZGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlbGV0ZUxhYmVsOiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBsYWJlbHMuZGVsZXRlKHtpZDogbGFiZWwuaWR9KVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmxhYmVsRGVsZXRlZChsYWJlbCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIG1lc3NhZ2VzLmhhbmRsZUVycm9yUmVzcG9uc2UpXG4gICAgICAgICAgICAgICAgICAgIC5maW5hbGx5KHRoaXMuZmluaXNoTG9hZGluZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGFiZWxEZWxldGVkOiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZExhYmVsICYmIHRoaXMuc2VsZWN0ZWRMYWJlbC5pZCA9PT0gbGFiZWwuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXNlbGVjdExhYmVsKGxhYmVsKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5sYWJlbHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubGFiZWxzW2ldLmlkID09PSBsYWJlbC5pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sYWJlbHMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2VsZWN0TGFiZWw6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRMYWJlbCA9IGxhYmVsO1xuICAgICAgICAgICAgICAgIGlmICghbGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kZW1pdCgnY2xlYXInKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiRlbWl0KCdzZWxlY3QnLCBsYWJlbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlc2VsZWN0TGFiZWw6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRMYWJlbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy4kZW1pdCgnZGVzZWxlY3QnLCBsYWJlbCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2VsZWN0Q29sb3I6IGZ1bmN0aW9uIChjb2xvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRDb2xvciA9IGNvbG9yO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNlbGVjdE5hbWU6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZE5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluc2VydExhYmVsOiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZSA9IGxhYmVsLm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAvLyBhZGQgdGhlIGxhYmVsIHRvIHRoZSBhcnJheSBzbyB0aGUgbGFiZWxzIHJlbWFpbiBzb3J0ZWQgYnkgdGhlaXIgbmFtZVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSB0aGlzLmxhYmVscy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5sYWJlbHNbaV0ubmFtZS50b0xvd2VyQ2FzZSgpID49IG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGFiZWxzLnNwbGljZShpLCAwLCBsYWJlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIGZ1bmN0aW9uIGRpZG4ndCByZXR1cm4gYnkgbm93IHRoZSBsYWJlbCBpcyBcInNtYWxsZXJcIiB0aGFuIGFsbFxuICAgICAgICAgICAgICAgIC8vIHRoZSBvdGhlciBsYWJlbHMuXG4gICAgICAgICAgICAgICAgdGhpcy5sYWJlbHMucHVzaChsYWJlbCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlTGFiZWw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sb2FkaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICAgICB2YXIgbGFiZWwgPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMuc2VsZWN0ZWROYW1lLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogdGhpcy5zZWxlY3RlZENvbG9yLFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZExhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsLnBhcmVudF9pZCA9IHRoaXMuc2VsZWN0ZWRMYWJlbC5pZDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBsYWJlbHMuc2F2ZSh7bGFiZWxfdHJlZV9pZDogbGFiZWxUcmVlLmlkfSwgbGFiZWwpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKHRoaXMubGFiZWxDcmVhdGVkLCBtZXNzYWdlcy5oYW5kbGVFcnJvclJlc3BvbnNlKVxuICAgICAgICAgICAgICAgICAgICAuZmluYWxseSh0aGlzLmZpbmlzaExvYWRpbmcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhYmVsQ3JlYXRlZDogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnNlcnRMYWJlbChyZXNwb25zZS5kYXRhWzBdKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkQ29sb3IgPSByYW5kb21Db2xvcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcbiIsIi8qKlxuICogRnVuY3Rpb24gcmV0dXJuaW5nIGEgcmFuZG9tIGNvbG9yXG4gKi9cbmJpaWdsZS4kZGVjbGFyZSgnbGFiZWxUcmVlcy5yYW5kb21Db2xvcicsIGZ1bmN0aW9uICgpIHtcbiAgICAvLyBIU1YgdmFsdWVzXG4gICAgdmFyIE1JTiA9IFswLCAwLjUsIDAuOV07XG4gICAgdmFyIE1BWCA9IFszNjAsIDEsIDFdO1xuXG4gICAgLy8gbnVtYmVyIG9mIGRlY2ltYWxzIHRvIGtlZXBcbiAgICB2YXIgUFJFQ0lTSU9OID0gWzAsIDIsIDJdO1xuXG4gICAgLy8gc2VlIGh0dHBzOi8vZGUud2lraXBlZGlhLm9yZy93aWtpL0hTVi1GYXJicmF1bSNUcmFuc2Zvcm1hdGlvbl92b25fUkdCX3VuZF9IU1YuMkZIU0xcbiAgICB2YXIgdG9SZ2IgPSBmdW5jdGlvbiAoaHN2KSB7XG4gICAgICAgIHZhciB0bXAgPSBoc3ZbMF0gLyA2MDtcbiAgICAgICAgdmFyIGhpID0gTWF0aC5mbG9vcih0bXApO1xuICAgICAgICB2YXIgZiA9IHRtcCAtIGhpO1xuICAgICAgICB2YXIgcHF0ID0gW1xuICAgICAgICAgICAgaHN2WzJdICogKDEgLSBoc3ZbMV0pLFxuICAgICAgICAgICAgaHN2WzJdICogKDEgLSBoc3ZbMV0gKiBmKSxcbiAgICAgICAgICAgIGhzdlsyXSAqICgxIC0gaHN2WzFdICogKDEgLSBmKSlcbiAgICAgICAgXTtcblxuICAgICAgICB2YXIgcmdiO1xuXG4gICAgICAgIHN3aXRjaCAoaGkpIHtcbiAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICByZ2IgPSBbcHF0WzFdLCBoc3ZbMl0sIHBxdFswXV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgcmdiID0gW3BxdFswXSwgaHN2WzJdLCBwcXRbMl1dO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgIHJnYiA9IFtwcXRbMF0sIHBxdFsxXSwgaHN2WzJdXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgICByZ2IgPSBbcHF0WzJdLCBwcXRbMF0sIGhzdlsyXV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICAgICAgcmdiID0gW2hzdlsyXSwgcHF0WzBdLCBwcXRbMV1dO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZ2IgPSBbaHN2WzJdLCBwcXRbMl0sIHBxdFswXV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmdiLm1hcChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChpdGVtICogMjU1KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciB0b0hleCA9IGZ1bmN0aW9uIChyZ2IpIHtcbiAgICAgICAgcmV0dXJuIHJnYi5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIGl0ZW0gPSBpdGVtLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgIHJldHVybiAoaXRlbS5sZW5ndGggPT09IDEpID8gKCcwJyArIGl0ZW0pIDogaXRlbTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjb2xvciA9IFswLCAwLCAwXTtcbiAgICAgICAgdmFyIHByZWNpc2lvbjtcbiAgICAgICAgZm9yICh2YXIgaSA9IGNvbG9yLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBwcmVjaXNpb24gPSAxMCAqIFBSRUNJU0lPTltpXTtcbiAgICAgICAgICAgIGNvbG9yW2ldID0gKE1BWFtpXSAtIE1JTltpXSkgKiBNYXRoLnJhbmRvbSgpICsgTUlOW2ldO1xuICAgICAgICAgICAgaWYgKHByZWNpc2lvbiAhPT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbG9yW2ldID0gTWF0aC5yb3VuZChjb2xvcltpXSAqIHByZWNpc2lvbikgLyBwcmVjaXNpb247XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbG9yW2ldID0gTWF0aC5yb3VuZChjb2xvcltpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gJyMnICsgdG9IZXgodG9SZ2IoY29sb3IpKS5qb2luKCcnKTtcbiAgICB9O1xufSk7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgYmlpZ2xlLmxhYmVsLXRyZWVzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQXV0aG9yaXplZFByb2plY3RzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSB0aGUgYXV0b3JpemVkIHByb2plY3RzIG9mIGEgbGFiZWwgdHJlZVxuICovXG5hbmd1bGFyLm1vZHVsZSgnYmlpZ2xlLmxhYmVsLXRyZWVzJykuY29udHJvbGxlcignQXV0aG9yaXplZFByb2plY3RzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIExBQkVMX1RSRUUsIEFVVEhfUFJPSkVDVFMsIEFVVEhfT1dOX1BST0pFQ1RTLCBQcm9qZWN0LCBMYWJlbFRyZWVBdXRob3JpemVkUHJvamVjdCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgZWRpdGluZyA9IGZhbHNlO1xuICAgICAgICB2YXIgbG9hZGluZyA9IGZhbHNlO1xuXG4gICAgICAgIHZhciBvd25Qcm9qZWN0cyA9IG51bGw7XG5cbiAgICAgICAgLy8gYWxsIHByb2plY3RzIHRoZSBjdXJyZW50IHVzZXIgYmVsb25ncyB0byBhbmQgdGhhdCBhcmUgbm90IGFscmVhZHkgYXV0aG9yaXplZFxuICAgICAgICB2YXIgcHJvamVjdHNGb3JBdXRob3JpemF0aW9uID0gbnVsbDtcblxuICAgICAgICB2YXIgcHJvamVjdElzTm90QXV0aG9yaXplZCA9IGZ1bmN0aW9uIChwcm9qZWN0KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gQVVUSF9QUk9KRUNUUy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIGlmIChBVVRIX1BST0pFQ1RTW2ldLmlkID09PSBwcm9qZWN0LmlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciB1cGRhdGVQcm9qZWN0c0ZvckF1dGhvcml6YXRpb24gPSBmdW5jdGlvbiAocHJvamVjdHMpIHtcbiAgICAgICAgICAgIHByb2plY3RzRm9yQXV0aG9yaXphdGlvbiA9IHByb2plY3RzLmZpbHRlcihwcm9qZWN0SXNOb3RBdXRob3JpemVkKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaGFuZGxlRXJyb3IgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIG1zZy5yZXNwb25zZUVycm9yKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIGxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcHJvamVjdEFkZGVkID0gZnVuY3Rpb24gKHByb2plY3QpIHtcbiAgICAgICAgICAgIEFVVEhfUFJPSkVDVFMucHVzaChwcm9qZWN0KTtcbiAgICAgICAgICAgIC8vIHVzZXIgY2FuIG9ubHkgYXV0aG9yaXplIG93biBwcm9qZWN0c1xuICAgICAgICAgICAgQVVUSF9PV05fUFJPSkVDVFMucHVzaChwcm9qZWN0LmlkKTtcbiAgICAgICAgICAgIHVwZGF0ZVByb2plY3RzRm9yQXV0aG9yaXphdGlvbihvd25Qcm9qZWN0cyk7XG4gICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHByb2plY3RSZW1vdmVkID0gZnVuY3Rpb24gKHByb2plY3QpIHtcbiAgICAgICAgICAgIHZhciBpO1xuICAgICAgICAgICAgZm9yIChpID0gQVVUSF9QUk9KRUNUUy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIGlmIChBVVRIX1BST0pFQ1RTW2ldLmlkID09PSBwcm9qZWN0LmlkKSB7XG4gICAgICAgICAgICAgICAgICAgIEFVVEhfUFJPSkVDVFMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGkgPSBBVVRIX09XTl9QUk9KRUNUUy5pbmRleE9mKHByb2plY3QuaWQpO1xuICAgICAgICAgICAgaWYgKGkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgQVVUSF9PV05fUFJPSkVDVFMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB1cGRhdGVQcm9qZWN0c0ZvckF1dGhvcml6YXRpb24ob3duUHJvamVjdHMpO1xuICAgICAgICAgICAgbG9hZGluZyA9IGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5oYXNQcm9qZWN0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBBVVRIX1BST0pFQ1RTLmxlbmd0aCA+IDA7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldFByb2plY3RzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIEFVVEhfUFJPSkVDVFM7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzT3duUHJvamVjdCA9IGZ1bmN0aW9uIChwcm9qZWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gQVVUSF9PV05fUFJPSkVDVFMuaW5kZXhPZihwcm9qZWN0LmlkKSAhPT0gLTE7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzRWRpdGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBlZGl0aW5nO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5nZXRWaXNpYmlsaXR5SWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gTEFCRUxfVFJFRS52aXNpYmlsaXR5X2lkO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS50b2dnbGVFZGl0aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCFvd25Qcm9qZWN0cykge1xuICAgICAgICAgICAgICAgIG93blByb2plY3RzID0gUHJvamVjdC5xdWVyeSh1cGRhdGVQcm9qZWN0c0ZvckF1dGhvcml6YXRpb24pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlZGl0aW5nID0gIWVkaXRpbmc7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzTG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBsb2FkaW5nO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5nZXRQcm9qZWN0c0ZvckF1dGhvcml6YXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvamVjdHNGb3JBdXRob3JpemF0aW9uO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5hZGRBdXRob3JpemVkUHJvamVjdCA9IGZ1bmN0aW9uIChwcm9qZWN0KSB7XG4gICAgICAgICAgICBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIExhYmVsVHJlZUF1dGhvcml6ZWRQcm9qZWN0LmFkZEF1dGhvcml6ZWQoXG4gICAgICAgICAgICAgICAge2lkOiBMQUJFTF9UUkVFLmlkfSxcbiAgICAgICAgICAgICAgICB7aWQ6IHByb2plY3QuaWR9LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvamVjdEFkZGVkKHByb2plY3QpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaGFuZGxlRXJyb3JcbiAgICAgICAgICAgICk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnJlbW92ZUF1dGhvcml6ZWRQcm9qZWN0ID0gZnVuY3Rpb24gKHByb2plY3QpIHtcbiAgICAgICAgICAgIGxvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgTGFiZWxUcmVlQXV0aG9yaXplZFByb2plY3QucmVtb3ZlQXV0aG9yaXplZChcbiAgICAgICAgICAgICAgICB7aWQ6IExBQkVMX1RSRUUuaWR9LFxuICAgICAgICAgICAgICAgIHtpZDogcHJvamVjdC5pZH0sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9qZWN0UmVtb3ZlZChwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGhhbmRsZUVycm9yXG4gICAgICAgICAgICApO1xuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgYmlpZ2xlLmxhYmVsLXRyZWVzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgTGFiZWxUcmVlQ29udHJvbGxlclxuICogQG1lbWJlck9mIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBsYWJlbCB0cmVlIGluZm9ybWF0aW9uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdiaWlnbGUubGFiZWwtdHJlZXMnKS5jb250cm9sbGVyKCdMYWJlbFRyZWVDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgIExBQkVMX1RSRUUsIExhYmVsVHJlZSwgbXNnLCAkdGltZW91dCwgTGFiZWxUcmVlVXNlciwgVVNFUl9JRCwgUkVESVJFQ1RfVVJMKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBlZGl0aW5nID0gZmFsc2U7XG4gICAgICAgIHZhciBzYXZpbmcgPSBmYWxzZTtcblxuICAgICAgICAkc2NvcGUubGFiZWxUcmVlSW5mbyA9IHtcbiAgICAgICAgICAgIG5hbWU6IExBQkVMX1RSRUUubmFtZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBMQUJFTF9UUkVFLmRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgdmlzaWJpbGl0eV9pZDogTEFCRUxfVFJFRS52aXNpYmlsaXR5X2lkLnRvU3RyaW5nKClcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaGFuZGxlU2F2aW5nRXJyb3IgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIG1zZy5yZXNwb25zZUVycm9yKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIHNhdmluZyA9IGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBpbmZvVXBkYXRlZCA9IGZ1bmN0aW9uICh0cmVlKSB7XG4gICAgICAgICAgICBMQUJFTF9UUkVFLm5hbWUgPSB0cmVlLm5hbWU7XG4gICAgICAgICAgICBMQUJFTF9UUkVFLmRlc2NyaXB0aW9uID0gdHJlZS5kZXNjcmlwdGlvbjtcbiAgICAgICAgICAgIExBQkVMX1RSRUUudmlzaWJpbGl0eV9pZCA9IHBhcnNlSW50KHRyZWUudmlzaWJpbGl0eV9pZCk7XG4gICAgICAgICAgICBlZGl0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICBzYXZpbmcgPSBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgdHJlZURlbGV0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtc2cuc3VjY2VzcygnVGhlIGxhYmVsIHRyZWUgd2FzIGRlbGV0ZWQuIFJlZGlyZWN0aW5nLi4uJyk7XG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBSRURJUkVDVF9VUkw7XG4gICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHVzZXJMZWZ0ID0gZnVuY3Rpb24gKHJlZGlyZWN0KSB7XG4gICAgICAgICAgICBpZiAocmVkaXJlY3QpIHtcbiAgICAgICAgICAgICAgICBtc2cuc3VjY2VzcygnWW91IGxlZnQgdGhlIGxhYmVsIHRyZWUuIFJlZGlyZWN0aW5nLi4uJyk7XG4gICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IFJFRElSRUNUX1VSTDtcbiAgICAgICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1zZy5zdWNjZXNzKCdZb3UgbGVmdCB0aGUgbGFiZWwgdHJlZS4gUmVsb2FkaW5nLi4uJyk7XG4gICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc0VkaXRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZWRpdGluZztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUudG9nZ2xlRWRpdGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGVkaXRpbmcgPSAhZWRpdGluZztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNTYXZpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gc2F2aW5nO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5nZXRWaXNpYmlsaXR5SWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gTEFCRUxfVFJFRS52aXNpYmlsaXR5X2lkO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5nZXROYW1lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIExBQkVMX1RSRUUubmFtZTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0RGVzY3JpcHRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gTEFCRUxfVFJFRS5kZXNjcmlwdGlvbjtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc2F2ZUNoYW5nZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzYXZpbmcgPSB0cnVlO1xuICAgICAgICAgICAgTGFiZWxUcmVlLnVwZGF0ZSh7XG4gICAgICAgICAgICAgICAgaWQ6IExBQkVMX1RSRUUuaWQsXG4gICAgICAgICAgICAgICAgbmFtZTogJHNjb3BlLmxhYmVsVHJlZUluZm8ubmFtZSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJHNjb3BlLmxhYmVsVHJlZUluZm8uZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgdmlzaWJpbGl0eV9pZDogcGFyc2VJbnQoJHNjb3BlLmxhYmVsVHJlZUluZm8udmlzaWJpbGl0eV9pZClcbiAgICAgICAgICAgIH0sIGluZm9VcGRhdGVkLCBoYW5kbGVTYXZpbmdFcnJvcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmRpc2NhcmRDaGFuZ2VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmxhYmVsVHJlZUluZm8ubmFtZSA9IExBQkVMX1RSRUUubmFtZTtcbiAgICAgICAgICAgICRzY29wZS5sYWJlbFRyZWVJbmZvLmRlc2NyaXB0aW9uID0gTEFCRUxfVFJFRS5kZXNjcmlwdGlvbjtcbiAgICAgICAgICAgICRzY29wZS5sYWJlbFRyZWVJbmZvLnZpc2liaWxpdHlfaWQgPSBMQUJFTF9UUkVFLnZpc2liaWxpdHlfaWQudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIGVkaXRpbmcgPSBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZGVsZXRlVHJlZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChjb25maXJtKCdEbyB5b3UgcmVhbGx5IHdhbnQgdG8gZGVsZXRlIHRoZSBsYWJlbCB0cmVlICcgKyBMQUJFTF9UUkVFLm5hbWUgKyAnPycpKSB7XG4gICAgICAgICAgICAgICAgTGFiZWxUcmVlLmRlbGV0ZSh7aWQ6IExBQkVMX1RSRUUuaWR9LCB0cmVlRGVsZXRlZCwgbXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5sZWF2ZVRyZWUgPSBmdW5jdGlvbiAocmVkaXJlY3QpIHtcbiAgICAgICAgICAgIC8vIHJlZGlyZWN0IGlmIHRoZSB0cmVlIGlzIHByaXZhdGUsIG90aGVyd2lzZSByZWxvYWRcbiAgICAgICAgICAgIGlmIChjb25maXJtKCdEbyB5b3UgcmVhbGx5IHdhbnQgdG8gbGVhdmUgdGhlIGxhYmVsIHRyZWUgJyArIExBQkVMX1RSRUUubmFtZSArICc/JykpIHtcbiAgICAgICAgICAgICAgICBMYWJlbFRyZWVVc2VyLmRldGFjaChcbiAgICAgICAgICAgICAgICAgICAge2xhYmVsX3RyZWVfaWQ6IExBQkVMX1RSRUUuaWR9LFxuICAgICAgICAgICAgICAgICAgICB7aWQ6IFVTRVJfSUR9LFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyTGVmdChyZWRpcmVjdCk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIG1zZy5yZXNwb25zZUVycm9yXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGJpaWdsZS5sYWJlbC10cmVlc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIExhYmVsc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBiaWlnbGUubGFiZWwtdHJlZXNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgaW50ZXJhY3RpdmUgbGFiZWwgdHJlZVxuICovXG5hbmd1bGFyLm1vZHVsZSgnYmlpZ2xlLmxhYmVsLXRyZWVzJykuY29udHJvbGxlcignTGFiZWxzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIExBQkVMUywgTEFCRUxfVFJFRSwgTGFiZWwsIG1zZywgJHEpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIGVkaXRpbmcgPSBmYWxzZTtcblxuICAgICAgICB2YXIgbG9hZGluZyA9IGZhbHNlO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZExhYmVsID0gbnVsbDtcblxuICAgICAgICAkc2NvcGUudHJlZSA9IHt9O1xuXG4gICAgICAgIC8vIElEcyBvZiBhbGwgbGFiZWxzIHRoYXQgYXJlIGN1cnJlbnRseSBvcGVuXG4gICAgICAgIC8vIChhbGwgcGFyZW50IGxhYmVscyBvZiB0aGUgc2VsZWN0ZWQgbGFiZWwpXG4gICAgICAgICRzY29wZS5vcGVuSGllcmFyY2h5ID0gW107XG5cbiAgICAgICAgdmFyIGhhbmRsZUVycm9yID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBtc2cucmVzcG9uc2VFcnJvcihyZXNwb25zZSk7XG4gICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGJ1aWxkVHJlZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS50cmVlID0ge307XG4gICAgICAgICAgICBMQUJFTFMuZm9yRWFjaChmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gbGFiZWwucGFyZW50X2lkO1xuICAgICAgICAgICAgICAgIGlmICgkc2NvcGUudHJlZVtwYXJlbnRdKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS50cmVlW3BhcmVudF0ucHVzaChsYWJlbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnRyZWVbcGFyZW50XSA9IFtsYWJlbF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZUNyZWF0ZUxhYmVsU3VjY2VzcyA9IGZ1bmN0aW9uIChsYWJlbHMpIHtcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KExBQkVMUywgbGFiZWxzKTtcbiAgICAgICAgICAgIGJ1aWxkVHJlZSgpO1xuICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ2xhYmVscy5yZWZyZXNoJyk7XG4gICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGxhYmVsRGVsZXRlZCA9IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IExBQkVMUy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIGlmIChMQUJFTFNbaV0uaWQgPT09IGxhYmVsLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgIExBQkVMUy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJ1aWxkVHJlZSgpO1xuICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ2xhYmVscy5yZWZyZXNoJyk7XG5cbiAgICAgICAgICAgIGlmIChzZWxlY3RlZExhYmVsICYmIHNlbGVjdGVkTGFiZWwuaWQgPT09IGxhYmVsLmlkKSB7XG4gICAgICAgICAgICAgICAgLy8gc2VsZWN0IHRoZSBwYXJlbnQgaWYgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBsYWJlbCB3YXMgZGVsZXRlZFxuICAgICAgICAgICAgICAgIHNlbGVjdGVkTGFiZWwgPSBnZXRMYWJlbChsYWJlbC5wYXJlbnRfaWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0TGFiZWwoc2VsZWN0ZWRMYWJlbCk7XG4gICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGdldExhYmVsID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gTEFCRUxTLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKExBQkVMU1tpXS5pZCA9PT0gaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIExBQkVMU1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciB1cGRhdGVPcGVuSGllcmFyY2h5ID0gZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICB2YXIgY3VycmVudExhYmVsID0gbGFiZWw7XG4gICAgICAgICAgICAkc2NvcGUub3BlbkhpZXJhcmNoeS5sZW5ndGggPSAwO1xuXG4gICAgICAgICAgICBpZiAoIWN1cnJlbnRMYWJlbCkgcmV0dXJuO1xuXG4gICAgICAgICAgICB3aGlsZSAoY3VycmVudExhYmVsLnBhcmVudF9pZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5vcGVuSGllcmFyY2h5LnVuc2hpZnQoY3VycmVudExhYmVsLnBhcmVudF9pZCk7XG4gICAgICAgICAgICAgICAgY3VycmVudExhYmVsID0gZ2V0TGFiZWwoY3VycmVudExhYmVsLnBhcmVudF9pZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnNlbGVjdExhYmVsID0gZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICBzZWxlY3RlZExhYmVsID0gbGFiZWw7XG4gICAgICAgICAgICB1cGRhdGVPcGVuSGllcmFyY2h5KGxhYmVsKTtcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdsYWJlbHMuc2VsZWN0ZWQnLCBsYWJlbCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWRMYWJlbCA9IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbGVjdGVkTGFiZWwgJiYgc2VsZWN0ZWRMYWJlbC5pZCA9PT0gbGFiZWwuaWQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmhhc0xhYmVscyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBMQUJFTFMubGVuZ3RoID4gMDtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNFZGl0aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGVkaXRpbmc7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnRvZ2dsZUVkaXRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBlZGl0aW5nID0gIWVkaXRpbmc7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldExhYmVscyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBMQUJFTFM7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmNyZWF0ZUxhYmVsID0gZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICAvLyBwcmV2ZW50IHVzZXJzIGZyb20gYWNjaWRlbnRhbGx5IGFkZGluZyBhIGxhYmVsIHR3aWNlXG4gICAgICAgICAgICBpZiAobG9hZGluZykge1xuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShbXSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgbGFiZWwubGFiZWxfdHJlZV9pZCA9IExBQkVMX1RSRUUuaWQ7XG4gICAgICAgICAgICByZXR1cm4gTGFiZWwuY3JlYXRlKGxhYmVsLCBoYW5kbGVDcmVhdGVMYWJlbFN1Y2Nlc3MsIGhhbmRsZUVycm9yKS4kcHJvbWlzZTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUucmVtb3ZlTGFiZWwgPSBmdW5jdGlvbiAobGFiZWwsIGUpIHtcbiAgICAgICAgICAgIGxvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIExhYmVsLmRlbGV0ZSh7aWQ6IGxhYmVsLmlkfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGxhYmVsRGVsZXRlZChsYWJlbCk7XG4gICAgICAgICAgICB9LCBoYW5kbGVFcnJvcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzTG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBsb2FkaW5nO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zdGFydExvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc3RvcExvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgYnVpbGRUcmVlKCk7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBiaWlnbGUubGFiZWwtdHJlZXNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBNYW51YWxMYWJlbHNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgYmlpZ2xlLmxhYmVsLXRyZWVzXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgbWFudWFsbHkgYWRkaW5nIGxhYmVscyB0byB0aGUgbGFiZWwgdHJlZVxuICovXG5hbmd1bGFyLm1vZHVsZSgnYmlpZ2xlLmxhYmVsLXRyZWVzJykuY29udHJvbGxlcignTWFudWFsTGFiZWxzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIHJhbmRvbUNvbG9yKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBERUZBVUxUUyA9IHtcbiAgICAgICAgICAgIExBQkVMOiBudWxsLFxuICAgICAgICAgICAgTkFNRTogJydcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc2VsZWN0ZWQgPSB7XG4gICAgICAgICAgICBsYWJlbDogREVGQVVMVFMuTEFCRUwsXG4gICAgICAgICAgICBjb2xvcjogcmFuZG9tQ29sb3IuZ2V0KCksXG4gICAgICAgICAgICBuYW1lOiBERUZBVUxUUy5OQU1FXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZUxhYmVsQ3JlYXRlU3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5yZXNldE5hbWUoKTtcblxuICAgICAgICAgICAgLy8gZG9uJ3QgcmVmcmVzaCB0aGUgY29sb3IgaWYgbmV3IGxhYmVscyBzaG91bGQgZ2V0IHRoZSBzYW1lIGNvbG9yIHRoYW4gdGhlXG4gICAgICAgICAgICAvLyBzZWxlY3RlZCAocGFyZW50KSBsYWJlbFxuICAgICAgICAgICAgaWYgKCEkc2NvcGUuc2VsZWN0ZWQubGFiZWwgfHwgKCcjJyArICRzY29wZS5zZWxlY3RlZC5sYWJlbC5jb2xvcikgIT09ICRzY29wZS5zZWxlY3RlZC5jb2xvcikge1xuICAgICAgICAgICAgICAgICRzY29wZS5yZWZyZXNoQ29sb3IoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUucmVzZXRQYXJlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0TGFiZWwoREVGQVVMVFMuTEFCRUwpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5yZWZyZXNoQ29sb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWQuY29sb3IgPSByYW5kb21Db2xvci5nZXQoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUucmVzZXROYW1lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkLm5hbWUgPSBERUZBVUxUUy5OQU1FO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc05hbWVEaXJ0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuc2VsZWN0ZWQubmFtZSAhPT0gREVGQVVMVFMuTkFNRTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNQYXJlbnREaXJ0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuc2VsZWN0ZWQubGFiZWwgIT09IERFRkFVTFRTLkxBQkVMO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5hZGRMYWJlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBsYWJlbCA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAkc2NvcGUuc2VsZWN0ZWQubmFtZSxcbiAgICAgICAgICAgICAgICBjb2xvcjogJHNjb3BlLnNlbGVjdGVkLmNvbG9yXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoJHNjb3BlLnNlbGVjdGVkLmxhYmVsKSB7XG4gICAgICAgICAgICAgICAgbGFiZWwucGFyZW50X2lkID0gJHNjb3BlLnNlbGVjdGVkLmxhYmVsLmlkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAkc2NvcGUuY3JlYXRlTGFiZWwobGFiZWwpLnRoZW4oaGFuZGxlTGFiZWxDcmVhdGVTdWNjZXNzKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuJG9uKCdsYWJlbHMuc2VsZWN0ZWQnLCBmdW5jdGlvbiAoZSwgbGFiZWwpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZC5sYWJlbCA9IGxhYmVsO1xuICAgICAgICAgICAgaWYgKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkLmNvbG9yID0gJyMnICsgbGFiZWwuY29sb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgYmlpZ2xlLmxhYmVsLXRyZWVzXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgTWVtYmVyc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBiaWlnbGUubGFiZWwtdHJlZXNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgdGhlIG1lbWJlcnMgb2YgYSBsYWJlbCB0cmVlXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdiaWlnbGUubGFiZWwtdHJlZXMnKS5jb250cm9sbGVyKCdNZW1iZXJzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIExBQkVMX1RSRUUsIE1FTUJFUlMsIFJPTEVTLCBERUZBVUxUX1JPTEVfSUQsIFVTRVJfSUQsIExhYmVsVHJlZVVzZXIsIG1zZywgVXNlcikge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgZWRpdGluZyA9IGZhbHNlO1xuICAgICAgICB2YXIgbG9hZGluZyA9IGZhbHNlO1xuXG4gICAgICAgICRzY29wZS5uZXdNZW1iZXIgPSB7XG4gICAgICAgICAgICB1c2VyOiBudWxsLFxuICAgICAgICAgICAgcm9sZV9pZDogREVGQVVMVF9ST0xFX0lELnRvU3RyaW5nKClcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaGFuZGxlRXJyb3IgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIG1zZy5yZXNwb25zZUVycm9yKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIGxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcm9sZVVwZGF0ZWQgPSBmdW5jdGlvbiAobWVtYmVyKSB7XG4gICAgICAgICAgICBtZW1iZXIucm9sZV9pZCA9IHBhcnNlSW50KG1lbWJlci50bXBfcm9sZV9pZCk7XG4gICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHJvbGVVcGRhdGVGYWlsZWQgPSBmdW5jdGlvbiAobWVtYmVyLCByZXNwb25zZSkge1xuICAgICAgICAgICAgbWVtYmVyLnRtcF9yb2xlX2lkID0gbWVtYmVyLnJvbGVfaWQudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIGhhbmRsZUVycm9yKHJlc3BvbnNlKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgbWVtYmVyUmVtb3ZlZCA9IGZ1bmN0aW9uIChtZW1iZXIpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBNRU1CRVJTLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKE1FTUJFUlNbaV0uaWQgPT09IG1lbWJlci5pZCkge1xuICAgICAgICAgICAgICAgICAgICBNRU1CRVJTLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbG9hZGluZyA9IGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciB1c2VySXNOb01lbWJlciA9IGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gTUVNQkVSUy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIGlmIChNRU1CRVJTW2ldLmlkID09PSB1c2VyLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBmaWx0ZXJNZW1iZXJzRnJvbVVzZXJzID0gZnVuY3Rpb24gKHVzZXJzKSB7XG4gICAgICAgICAgICByZXR1cm4gdXNlcnMuZmlsdGVyKHVzZXJJc05vTWVtYmVyKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgbWVtYmVyQXR0YWNoZWQgPSBmdW5jdGlvbiAobWVtYmVyKSB7XG4gICAgICAgICAgICBtZW1iZXIudG1wX3JvbGVfaWQgPSBtZW1iZXIucm9sZV9pZC50b1N0cmluZygpO1xuICAgICAgICAgICAgTUVNQkVSUy5wdXNoKG1lbWJlcik7XG4gICAgICAgICAgICAkc2NvcGUubmV3TWVtYmVyLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgbG9hZGluZyA9IGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc0VkaXRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZWRpdGluZztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUudG9nZ2xlRWRpdGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGVkaXRpbmcgPSAhZWRpdGluZztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNMb2FkaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGxvYWRpbmc7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldE1lbWJlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gTUVNQkVSUztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaGFzTWVtYmVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBNRU1CRVJTLmxlbmd0aCA+IDA7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldFJvbGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFJPTEVTO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5nZXRSb2xlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gUk9MRVNbaWRdO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc093blVzZXIgPSBmdW5jdGlvbiAobWVtYmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gVVNFUl9JRCA9PT0gbWVtYmVyLmlkO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS51cGRhdGVSb2xlID0gZnVuY3Rpb24gKG1lbWJlcikge1xuICAgICAgICAgICAgbG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICBMYWJlbFRyZWVVc2VyLnVwZGF0ZShcbiAgICAgICAgICAgICAgICB7bGFiZWxfdHJlZV9pZDogTEFCRUxfVFJFRS5pZH0sXG4gICAgICAgICAgICAgICAge2lkOiBtZW1iZXIuaWQsIHJvbGVfaWQ6IHBhcnNlSW50KG1lbWJlci50bXBfcm9sZV9pZCl9LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcm9sZVVwZGF0ZWQobWVtYmVyKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICByb2xlVXBkYXRlRmFpbGVkKG1lbWJlciwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmRldGFjaE1lbWJlciA9IGZ1bmN0aW9uIChtZW1iZXIpIHtcbiAgICAgICAgICAgIGxvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgTGFiZWxUcmVlVXNlci5kZXRhY2goXG4gICAgICAgICAgICAgICAge2xhYmVsX3RyZWVfaWQ6IExBQkVMX1RSRUUuaWR9LFxuICAgICAgICAgICAgICAgIHtpZDogbWVtYmVyLmlkfSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lbWJlclJlbW92ZWQobWVtYmVyKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGhhbmRsZUVycm9yXG4gICAgICAgICAgICApO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS51c2VybmFtZSA9IGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICBpZiAodXNlciAmJiB1c2VyLmZpcnN0bmFtZSAmJiB1c2VyLmxhc3RuYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVzZXIuZmlyc3RuYW1lICsgJyAnICsgdXNlci5sYXN0bmFtZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5maW5kVXNlciA9IGZ1bmN0aW9uIChxdWVyeSkge1xuICAgICAgICAgICAgcmV0dXJuIFVzZXIuZmluZCh7cXVlcnk6IGVuY29kZVVSSUNvbXBvbmVudChxdWVyeSl9KS4kcHJvbWlzZVxuICAgICAgICAgICAgICAgIC50aGVuKGZpbHRlck1lbWJlcnNGcm9tVXNlcnMpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5uZXdNZW1iZXJWYWxpZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUubmV3TWVtYmVyLnVzZXIgJiZcbiAgICAgICAgICAgICAgICAkc2NvcGUubmV3TWVtYmVyLnVzZXIuaWQgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgICAgIHVzZXJJc05vTWVtYmVyKCRzY29wZS5uZXdNZW1iZXIudXNlcikgJiZcbiAgICAgICAgICAgICAgICAkc2NvcGUubmV3TWVtYmVyLnJvbGVfaWQgIT09IG51bGw7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmF0dGFjaE1lbWJlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghJHNjb3BlLm5ld01lbWJlclZhbGlkKCkpIHJldHVybjtcblxuICAgICAgICAgICAgbG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICB2YXIgbWVtYmVyID0gJHNjb3BlLm5ld01lbWJlci51c2VyO1xuICAgICAgICAgICAgLy8gb3ZlcndyaXRlIGdsb2JhbCByb2xlX2lkIHJldHVybmVkIGZyb20gVXNlci5maW5kKCkgd2l0aCBsYWJlbCB0cmVlIHJvbGVfaWRcbiAgICAgICAgICAgIG1lbWJlci5yb2xlX2lkID0gcGFyc2VJbnQoJHNjb3BlLm5ld01lbWJlci5yb2xlX2lkKTtcblxuICAgICAgICAgICAgTGFiZWxUcmVlVXNlci5hdHRhY2goXG4gICAgICAgICAgICAgICAge2xhYmVsX3RyZWVfaWQ6IExBQkVMX1RSRUUuaWR9LFxuICAgICAgICAgICAgICAgIHtpZDogbWVtYmVyLmlkLCByb2xlX2lkOiBtZW1iZXIucm9sZV9pZH0sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBtZW1iZXJBdHRhY2hlZChtZW1iZXIpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaGFuZGxlRXJyb3JcbiAgICAgICAgICAgICk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gY29udmVydCByb2xlIElEcyB0byBzdHJpbmcgc28gdGhleSBjYW4gYmUgc2VsZWN0ZWQgaW4gYSBzZWxlY3QgaW5wdXQgZmllbGRcbiAgICAgICAgLy8gYWxzbyBhZGQgaXQgYXMgdG1wX3JvbGVfaWQgc28gdGhlIElEIGNhbiBiZSByZXNldCBpZiB0aGUgY2hhbmdlIGZhaWxlZFxuICAgICAgICBmb3IgKHZhciBpID0gTUVNQkVSUy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgTUVNQkVSU1tpXS50bXBfcm9sZV9pZCA9IE1FTUJFUlNbaV0ucm9sZV9pZC50b1N0cmluZygpO1xuICAgICAgICB9XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBiaWlnbGUubGFiZWwtdHJlZXNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBXb3Jtc0xhYmVsc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBiaWlnbGUubGFiZWwtdHJlZXNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciBpbXBvcnRpbmcgbGFiZWxzIGZyb20gV29STVNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2JpaWdsZS5sYWJlbC10cmVlcycpLmNvbnRyb2xsZXIoJ1dvcm1zTGFiZWxzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIExhYmVsU291cmNlLCBMQUJFTF9TT1VSQ0VTLCBtc2csIHJhbmRvbUNvbG9yKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIC8vIFdvUk1TIGxhYmVsIHNvdXJjZVxuICAgICAgICB2YXIgc291cmNlID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBMQUJFTF9TT1VSQ0VTLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKExBQkVMX1NPVVJDRVNbaV0ubmFtZSA9PT0gJ3dvcm1zJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gTEFCRUxfU09VUkNFU1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKCk7XG5cbiAgICAgICAgdmFyIERFRkFVTFRTID0ge1xuICAgICAgICAgICAgTEFCRUw6IG51bGwsXG4gICAgICAgICAgICBOQU1FOiAnJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBmaW5kUmVzdWx0cyA9IFtdO1xuICAgICAgICAvLyBpcyB0aGUgc2VhcmNoIHF1ZXJ5IGN1cnJlbnRseSBiZWluZyBwcm9jZXNzZWQ/XG4gICAgICAgIHZhciBmaW5kaW5nID0gZmFsc2U7XG5cbiAgICAgICAgLy8gaXMgdGhlIHJlY3Vyc2l2ZSBvcHRpb24gYWN0aXZhdGVkP1xuICAgICAgICB2YXIgcmVjdXJzaXZlID0gZmFsc2U7XG5cbiAgICAgICAgLy8gc291cmNlX2lkIG9mIGFsbCBsYWJlbHMgdGhhdCB3ZXJlIGltcG9ydGVkIGluIHRoaXMgc2Vzc2lvblxuICAgICAgICB2YXIgaW1wb3J0ZWRJZHMgPSBbXTtcblxuICAgICAgICB2YXIgaGFuZGxlRmluZEVycm9yID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBmaW5kaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUuc3RvcExvYWRpbmcoKTtcbiAgICAgICAgICAgIG1zZy5yZXNwb25zZUVycm9yKHJlc3BvbnNlKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaGFuZGxlRmluZFN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmaW5kaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUuc3RvcExvYWRpbmcoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgYWRkSW1wb3J0ZWRJZHMgPSBmdW5jdGlvbiAobGFiZWxzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gbGFiZWxzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgaW1wb3J0ZWRJZHMucHVzaChwYXJzZUludChsYWJlbHNbaV0uc291cmNlX2lkKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGRvbid0IHJlZnJlc2ggdGhlIGNvbG9yIGlmIG5ldyBsYWJlbHMgc2hvdWxkIGdldCB0aGUgc2FtZSBjb2xvciB0aGFuIHRoZVxuICAgICAgICAgICAgLy8gc2VsZWN0ZWQgKHBhcmVudCkgbGFiZWxcbiAgICAgICAgICAgIGlmICghJHNjb3BlLnNlbGVjdGVkLmxhYmVsIHx8ICgnIycgKyAkc2NvcGUuc2VsZWN0ZWQubGFiZWwuY29sb3IpICE9PSAkc2NvcGUuc2VsZWN0ZWQuY29sb3IpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUucmVmcmVzaENvbG9yKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnNlbGVjdGVkID0ge1xuICAgICAgICAgICAgbGFiZWw6IERFRkFVTFRTLkxBQkVMLFxuICAgICAgICAgICAgY29sb3I6IHJhbmRvbUNvbG9yLmdldCgpLFxuICAgICAgICAgICAgbmFtZTogREVGQVVMVFMuTkFNRVxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5nZXRGaW5kUmVzdWx0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBmaW5kUmVzdWx0cztcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNGaW5kaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGZpbmRpbmc7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmhhc0ZpbmRSZXN1bHRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGZpbmRSZXN1bHRzLmxlbmd0aCA+IDA7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmZpbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmaW5kaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICRzY29wZS5zdGFydExvYWRpbmcoKTtcbiAgICAgICAgICAgIGZpbmRSZXN1bHRzID0gTGFiZWxTb3VyY2UucXVlcnkoXG4gICAgICAgICAgICAgICAge2lkOiBzb3VyY2UuaWQsIHF1ZXJ5OiAkc2NvcGUuc2VsZWN0ZWQubmFtZX0sXG4gICAgICAgICAgICAgICAgaGFuZGxlRmluZFN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgaGFuZGxlRmluZEVycm9yXG4gICAgICAgICAgICApO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5nZXRDbGFzc2lmaWNhdGlvbiA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbS5wYXJlbnRzLmpvaW4oJyA+ICcpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5yZXNldFBhcmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RMYWJlbChERUZBVUxUUy5MQUJFTCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnJlZnJlc2hDb2xvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZC5jb2xvciA9IHJhbmRvbUNvbG9yLmdldCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc05hbWVEaXJ0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuc2VsZWN0ZWQubmFtZSAhPT0gREVGQVVMVFMuTkFNRTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNQYXJlbnREaXJ0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuc2VsZWN0ZWQubGFiZWwgIT09IERFRkFVTFRTLkxBQkVMO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS50b2dnbGVSZWN1cnNpdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZWN1cnNpdmUgPSAhcmVjdXJzaXZlO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc1JlY3Vyc2l2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiByZWN1cnNpdmU7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmFkZExhYmVsID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIHZhciBsYWJlbCA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgY29sb3I6ICRzY29wZS5zZWxlY3RlZC5jb2xvcixcbiAgICAgICAgICAgICAgICBzb3VyY2VfaWQ6IGl0ZW0uYXBoaWFfaWQsXG4gICAgICAgICAgICAgICAgbGFiZWxfc291cmNlX2lkOiBzb3VyY2UuaWRcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChyZWN1cnNpdmUpIHtcbiAgICAgICAgICAgICAgICBsYWJlbC5yZWN1cnNpdmUgPSAndHJ1ZSc7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCRzY29wZS5zZWxlY3RlZC5sYWJlbCkge1xuICAgICAgICAgICAgICAgIGxhYmVsLnBhcmVudF9pZCA9ICRzY29wZS5zZWxlY3RlZC5sYWJlbC5pZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgJHNjb3BlLmNyZWF0ZUxhYmVsKGxhYmVsKS50aGVuKGFkZEltcG9ydGVkSWRzKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0QWRkQnV0dG9uVGl0bGUgPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgaWYgKCRzY29wZS5pc1JlY3Vyc2l2ZSgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdBZGQgJyArIGl0ZW0ubmFtZSArICcgYW5kIGFsbCBXb1JNUyBwYXJlbnRzIGFzIG5ldyBsYWJlbHMnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoJHNjb3BlLmlzUGFyZW50RGlydHkoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnQWRkICcgKyBpdGVtLm5hbWUgKyAnIGFzIGEgY2hpbGQgb2YgJyArICRzY29wZS5zZWxlY3RlZC5sYWJlbC5uYW1lO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gJ0FkZCAnICsgaXRlbS5uYW1lICsgJyBhcyBhIHJvb3QgbGFiZWwnO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5oYXNCZWVuSW1wb3J0ZWQgPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIGltcG9ydGVkSWRzLmluZGV4T2YoaXRlbS5hcGhpYV9pZCkgIT09IC0xO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS4kb24oJ2xhYmVscy5zZWxlY3RlZCcsIGZ1bmN0aW9uIChlLCBsYWJlbCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkLmxhYmVsID0gbGFiZWw7XG4gICAgICAgICAgICBpZiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWQuY29sb3IgPSAnIycgKyBsYWJlbC5jb2xvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBiaWlnbGUubGFiZWwtdHJlZXNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGxhYmVsVHJlZUl0ZW1cbiAqIEBtZW1iZXJPZiBiaWlnbGUubGFiZWwtdHJlZXNcbiAqIEBkZXNjcmlwdGlvbiBBIGxhYmVsIHRyZWUgaXRlbS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2JpaWdsZS5sYWJlbC10cmVlcycpLmRpcmVjdGl2ZSgnbGFiZWxUcmVlSXRlbScsIGZ1bmN0aW9uICgkY29tcGlsZSwgJHRpbWVvdXQsICR0ZW1wbGF0ZUNhY2hlKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0MnLFxuXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2xhYmVsLWl0ZW0uaHRtbCcsXG5cbiAgICAgICAgICAgIHNjb3BlOiB0cnVlLFxuXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgLy8gd2FpdCBmb3IgdGhpcyBlbGVtZW50IHRvIGJlIHJlbmRlcmVkIHVudGlsIHRoZSBjaGlsZHJlbiBhcmVcbiAgICAgICAgICAgICAgICAvLyBhcHBlbmRlZCwgb3RoZXJ3aXNlIHRoZXJlIHdvdWxkIGJlIHRvbyBtdWNoIHJlY3Vyc2lvbiBmb3JcbiAgICAgICAgICAgICAgICAvLyBhbmd1bGFyXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSBhbmd1bGFyLmVsZW1lbnQoJHRlbXBsYXRlQ2FjaGUuZ2V0KCdsYWJlbC1zdWJ0cmVlLmh0bWwnKSk7XG4gICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFwcGVuZCgkY29tcGlsZShjb250ZW50KShzY29wZSkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSkge1xuICAgICAgICAgICAgICAgIC8vIG9wZW4gdGhlIHN1YnRyZWUgb2YgdGhpcyBpdGVtXG4gICAgICAgICAgICAgICAgdmFyIG9wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaGFzIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgdmFyIGV4cGFuZGFibGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaXMgY3VycmVudGx5IHNlbGVjdGVkXG4gICAgICAgICAgICAgICAgdmFyIHNlbGVjdGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICB2YXIgY2hlY2tTdGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5vcGVuSGllcmFyY2h5LmluZGV4T2YoJHNjb3BlLml0ZW0uaWQpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3BlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCRzY29wZS5pc1NlbGVjdGVkTGFiZWwoJHNjb3BlLml0ZW0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdmFyIGNoZWNrRXhwYW5kYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZXhwYW5kYWJsZSA9ICRzY29wZS50cmVlICYmICRzY29wZS50cmVlLmhhc093blByb3BlcnR5KCRzY29wZS5pdGVtLmlkKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmdldFN1YnRyZWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcGVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHNjb3BlLnRyZWVbJHNjb3BlLml0ZW0uaWRdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgICAgIH07XG5cblxuICAgICAgICAgICAgICAgICRzY29wZS5nZXRDbGFzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZW46IG9wZW4sXG4gICAgICAgICAgICAgICAgICAgICAgICBleHBhbmRhYmxlOiBleHBhbmRhYmxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWQ6IHNlbGVjdGVkXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ2xhYmVscy5zZWxlY3RlZCcsIGNoZWNrU3RhdGUpO1xuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ2xhYmVscy5yZWZyZXNoJywgY2hlY2tFeHBhbmRhYmxlKTtcbiAgICAgICAgICAgICAgICBjaGVja1N0YXRlKCk7XG4gICAgICAgICAgICAgICAgY2hlY2tFeHBhbmRhYmxlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBiaWlnbGUuYXRlXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgcmFuY29tQ29sb3JcbiAqIEBtZW1iZXJPZiBiaWlnbGUubGFiZWwtdHJlZXNcbiAqIEBkZXNjcmlwdGlvbiBQcm92aWRlcyBhIG1hY2hhbmlzbSBmb3IgcmFuZG9tIGNvbG9yc1xuICovXG5hbmd1bGFyLm1vZHVsZSgnYmlpZ2xlLmxhYmVsLXRyZWVzJykuc2VydmljZSgncmFuZG9tQ29sb3InLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIC8vIEhTViB2YWx1ZXNcbiAgICAgICAgdmFyIE1JTiA9IFswLCAwLjUsIDAuOV07XG4gICAgICAgIHZhciBNQVggPSBbMzYwLCAxLCAxXTtcblxuICAgICAgICAvLyBudW1iZXIgb2YgZGVjaW1hbHMgdG8ga2VlcFxuICAgICAgICB2YXIgUFJFQ0lTSU9OID0gWzAsIDIsIDJdO1xuXG4gICAgICAgIC8vIHNlZSBodHRwczovL2RlLndpa2lwZWRpYS5vcmcvd2lraS9IU1YtRmFyYnJhdW0jVHJhbnNmb3JtYXRpb25fdm9uX1JHQl91bmRfSFNWLjJGSFNMXG4gICAgICAgIHZhciB0b1JnYiA9IGZ1bmN0aW9uIChoc3YpIHtcblxuICAgICAgICAgICAgdmFyIHRtcCA9IGhzdlswXSAvIDYwO1xuICAgICAgICAgICAgdmFyIGhpID0gTWF0aC5mbG9vcih0bXApO1xuICAgICAgICAgICAgdmFyIGYgPSB0bXAgLSBoaTtcbiAgICAgICAgICAgIHZhciBwcXQgPSBbXG4gICAgICAgICAgICAgICAgaHN2WzJdICogKDEgLSBoc3ZbMV0pLFxuICAgICAgICAgICAgICAgIGhzdlsyXSAqICgxIC0gaHN2WzFdICogZiksXG4gICAgICAgICAgICAgICAgaHN2WzJdICogKDEgLSBoc3ZbMV0gKiAoMSAtIGYpKVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgdmFyIHJnYjtcblxuICAgICAgICAgICAgc3dpdGNoIChoaSkge1xuICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgcmdiID0gW3BxdFsxXSwgaHN2WzJdLCBwcXRbMF1dO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgICAgIHJnYiA9IFtwcXRbMF0sIGhzdlsyXSwgcHF0WzJdXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgICAgICByZ2IgPSBbcHF0WzBdLCBwcXRbMV0sIGhzdlsyXV07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgICAgICAgcmdiID0gW3BxdFsyXSwgcHF0WzBdLCBoc3ZbMl1dO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICAgICAgICAgIHJnYiA9IFtoc3ZbMl0sIHBxdFswXSwgcHF0WzFdXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgcmdiID0gW2hzdlsyXSwgcHF0WzJdLCBwcXRbMF1dO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmdiLm1hcChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoaXRlbSAqIDI1NSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgdG9IZXggPSBmdW5jdGlvbiAocmdiKSB7XG4gICAgICAgICAgICByZXR1cm4gcmdiLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIGl0ZW0gPSBpdGVtLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGl0ZW0ubGVuZ3RoID09PSAxKSA/ICgnMCcgKyBpdGVtKSA6IGl0ZW07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjb2xvciA9IFswLCAwLCAwXTtcbiAgICAgICAgICAgIHZhciBwcmVjaXNpb247XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gY29sb3IubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBwcmVjaXNpb24gPSAxMCAqIFBSRUNJU0lPTltpXTtcbiAgICAgICAgICAgICAgICBjb2xvcltpXSA9IChNQVhbaV0gLSBNSU5baV0pICogTWF0aC5yYW5kb20oKSArIE1JTltpXTtcbiAgICAgICAgICAgICAgICBpZiAocHJlY2lzaW9uICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbG9yW2ldID0gTWF0aC5yb3VuZChjb2xvcltpXSAqIHByZWNpc2lvbikgLyBwcmVjaXNpb247XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29sb3JbaV0gPSBNYXRoLnJvdW5kKGNvbG9yW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAnIycgKyB0b0hleCh0b1JnYihjb2xvcikpLmpvaW4oJycpO1xuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIFJlc291cmNlIGZvciBsYWJlbHMuXG4gKlxuICogdmFyIHJlc291cmNlID0gYmlpZ2xlLiRyZXF1aXJlKCdhcGkubGFiZWxzJyk7XG4gKlxuICogQ3JlYXRlIGEgbGFiZWw6XG4gKlxuICogcmVzb3VyY2Uuc2F2ZSh7bGFiZWxfdHJlZV9pZDogMX0sIHtcbiAqICAgICBuYW1lOiBcIlRyYXNoXCIsXG4gKiAgICAgY29sb3I6ICdiYWRhNTUnXG4gKiB9KS50aGVuKC4uLik7XG4gKlxuICogRGVsZXRlIGEgbGFiZWw6XG4gKlxuICogcmVzb3VyY2UuZGVsZXRlKHtpZDogbGFiZWxJZH0pLnRoZW4oLi4uKTtcbiAqXG4gKiBAdHlwZSB7VnVlLnJlc291cmNlfVxuICovXG5iaWlnbGUuJGRlY2xhcmUoJ2FwaS5sYWJlbHMnLCBWdWUucmVzb3VyY2UoJy9hcGkvdjEvbGFiZWxzey9pZH0nLCB7fSwge1xuICAgIHNhdmU6IHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIHVybDogJy9hcGkvdjEvbGFiZWwtdHJlZXN7L2xhYmVsX3RyZWVfaWR9L2xhYmVscycsXG4gICAgfVxufSkpO1xuIiwiLyoqXG4gKiBBIGNvbXBvbmVudCB0aGF0IGRpc3BsYXlzIGEgbGFiZWwgdHJlZS4gVGhlIGxhYmVscyBjYW4gYmUgc2VhcmNoZWQgYW5kIHNlbGVjdGVkLlxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbmJpaWdsZS4kY29tcG9uZW50KCdsYWJlbFRyZWVzLmNvbXBvbmVudHMubGFiZWxUcmVlJywge1xuICAgIHRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cImxhYmVsLXRyZWVcIj4nICtcbiAgICAgICAgJzxoNCBjbGFzcz1cImxhYmVsLXRyZWVfX3RpdGxlXCIgdi1pZj1cInNob3dUaXRsZVwiPicgK1xuICAgICAgICAgICAgJzxidXR0b24gdi1pZj1cImNvbGxhcHNpYmxlXCIgQGNsaWNrLnN0b3A9XCJjb2xsYXBzZVwiIGNsYXNzPVwiYnRuIGJ0bi1kZWZhdWx0IGJ0bi14cyBwdWxsLXJpZ2h0XCIgOnRpdGxlPVwiY29sbGFwc2VUaXRsZVwiPicgK1xuICAgICAgICAgICAgICAgICc8c3BhbiB2LWlmPVwiY29sbGFwc2VkXCIgY2xhc3M9XCJnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tZG93blwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj4nICtcbiAgICAgICAgICAgICAgICAnPHNwYW4gdi1lbHNlIGNsYXNzPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXVwXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9zcGFuPicgK1xuICAgICAgICAgICAgJzwvYnV0dG9uPicgK1xuICAgICAgICAgICAgJ3t7bmFtZX19JyArXG4gICAgICAgICc8L2g0PicgK1xuICAgICAgICAnPHVsIHYtaWY9XCIhY29sbGFwc2VkXCIgY2xhc3M9XCJsYWJlbC10cmVlX19saXN0XCI+JyArXG4gICAgICAgICAgICAnPGxhYmVsLXRyZWUtbGFiZWwgOmxhYmVsPVwibGFiZWxcIiA6ZGVsZXRhYmxlPVwiZGVsZXRhYmxlXCIgdi1mb3I9XCJsYWJlbCBpbiByb290TGFiZWxzXCIgQHNlbGVjdD1cImVtaXRTZWxlY3RcIiBAZGVzZWxlY3Q9XCJlbWl0RGVzZWxlY3RcIiBAZGVsZXRlPVwiZW1pdERlbGV0ZVwiPjwvbGFiZWwtdHJlZS1sYWJlbD4nICtcbiAgICAgICAgJzwvdWw+JyArXG4gICAgJzwvZGl2PicsXG4gICAgZGF0YTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29sbGFwc2VkOiBmYWxzZVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgY29tcG9uZW50czoge1xuICAgICAgICBsYWJlbFRyZWVMYWJlbDogYmlpZ2xlLiRyZXF1aXJlKCdsYWJlbFRyZWVzLmNvbXBvbmVudHMubGFiZWxUcmVlTGFiZWwnKSxcbiAgICB9LFxuICAgIHByb3BzOiB7XG4gICAgICAgIG5hbWU6IHtcbiAgICAgICAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBsYWJlbHM6IHtcbiAgICAgICAgICAgIHR5cGU6IEFycmF5LFxuICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHNob3dUaXRsZToge1xuICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHN0YW5kYWxvbmU6IHtcbiAgICAgICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgY29sbGFwc2libGU6IHtcbiAgICAgICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBtdWx0aXNlbGVjdDoge1xuICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICBkZWxldGFibGU6IHtcbiAgICAgICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgbGFiZWxNYXA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBtYXAgPSB7fTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSB0aGlzLmxhYmVscy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIG1hcFt0aGlzLmxhYmVsc1tpXS5pZF0gPSB0aGlzLmxhYmVsc1tpXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG1hcDtcbiAgICAgICAgfSxcbiAgICAgICAgY29tcGlsZWRMYWJlbHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjb21waWxlZCA9IHt9O1xuICAgICAgICAgICAgdmFyIHBhcmVudDtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBkYXRhc3RydWN0dXJlIHRoYXQgbWFwcyBsYWJlbCBJRHMgdG8gdGhlIGNoaWxkIGxhYmVscy5cbiAgICAgICAgICAgIC8vIEdvIGZyb20gMCB0byBsZW5ndGggc28gdGhlIGxhYmVscyBhcmUga2VwdCBpbiBvcmRlci5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSB0aGlzLmxhYmVscy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHBhcmVudCA9IHRoaXMubGFiZWxzW2ldLnBhcmVudF9pZDtcbiAgICAgICAgICAgICAgICBpZiAoY29tcGlsZWQuaGFzT3duUHJvcGVydHkocGFyZW50KSkge1xuICAgICAgICAgICAgICAgICAgICBjb21waWxlZFtwYXJlbnRdLnB1c2godGhpcy5sYWJlbHNbaV0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBpbGVkW3BhcmVudF0gPSBbdGhpcy5sYWJlbHNbaV1dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBsYWJlbCBjaGlsZHJlbiB3aXRoIHRoZSBjb21waWxlZCBkYXRhc3RydWN0dXJlXG4gICAgICAgICAgICBmb3IgKGkgPSB0aGlzLmxhYmVscy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIGlmIChjb21waWxlZC5oYXNPd25Qcm9wZXJ0eSh0aGlzLmxhYmVsc1tpXS5pZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgVnVlLnNldCh0aGlzLmxhYmVsc1tpXSwgJ2NoaWxkcmVuJywgY29tcGlsZWRbdGhpcy5sYWJlbHNbaV0uaWRdKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBWdWUuc2V0KHRoaXMubGFiZWxzW2ldLCAnY2hpbGRyZW4nLCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNvbXBpbGVkO1xuICAgICAgICB9LFxuICAgICAgICByb290TGFiZWxzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb21waWxlZExhYmVsc1tudWxsXTtcbiAgICAgICAgfSxcbiAgICAgICAgY29sbGFwc2VUaXRsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29sbGFwc2VkID8gJ0V4cGFuZCcgOiAnQ29sbGFwc2UnO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIGhhc0xhYmVsOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxhYmVsTWFwLmhhc093blByb3BlcnR5KGlkKTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0TGFiZWw6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFiZWxNYXBbaWRdO1xuICAgICAgICB9LFxuICAgICAgICBnZXRQYXJlbnRzOiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnRzID0gW107XG4gICAgICAgICAgICB3aGlsZSAobGFiZWwucGFyZW50X2lkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbGFiZWwgPSB0aGlzLmdldExhYmVsKGxhYmVsLnBhcmVudF9pZCk7XG4gICAgICAgICAgICAgICAgcGFyZW50cy51bnNoaWZ0KGxhYmVsLmlkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHBhcmVudHM7XG4gICAgICAgIH0sXG4gICAgICAgIGVtaXRTZWxlY3Q6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgnc2VsZWN0JywgbGFiZWwpO1xuICAgICAgICB9LFxuICAgICAgICBlbWl0RGVzZWxlY3Q6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgnZGVzZWxlY3QnLCBsYWJlbCk7XG4gICAgICAgIH0sXG4gICAgICAgIGVtaXREZWxldGU6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgnZGVsZXRlJywgbGFiZWwpO1xuICAgICAgICB9LFxuICAgICAgICBzZWxlY3RMYWJlbDogZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMubXVsdGlzZWxlY3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyU2VsZWN0ZWRMYWJlbHMoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVGhlIHNlbGVjdGVkIGxhYmVsIGRvZXMgbm90IG5lc3NlY2FyaWx5IGJlbG9uZyB0byB0aGlzIGxhYmVsIHRyZWUgc2luY2VcbiAgICAgICAgICAgIC8vIHRoZSB0cmVlIG1heSBiZSBkaXNwbGF5ZWQgaW4gYSBsYWJlbC10cmVlcyBjb21wb25lbnQgd2l0aCBvdGhlciB0cmVlcy5cbiAgICAgICAgICAgIGlmICh0aGlzLmhhc0xhYmVsKGxhYmVsLmlkKSkge1xuICAgICAgICAgICAgICAgIGxhYmVsLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbGxhcHNlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHZhciBwYXJlbnRzID0gdGhpcy5nZXRQYXJlbnRzKGxhYmVsKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gcGFyZW50cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldExhYmVsKHBhcmVudHNbaV0pLm9wZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZGVzZWxlY3RMYWJlbDogZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5oYXNMYWJlbChsYWJlbC5pZCkpIHtcbiAgICAgICAgICAgICAgICBsYWJlbC5zZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjbGVhclNlbGVjdGVkTGFiZWxzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5sYWJlbHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxhYmVsc1tpXS5zZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjb2xsYXBzZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5jb2xsYXBzZWQgPSAhdGhpcy5jb2xsYXBzZWQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGNyZWF0ZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gU2V0IHRoZSBsYWJlbCBwcm9wZXJ0aWVzXG4gICAgICAgIGZvciAoaSA9IHRoaXMubGFiZWxzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBWdWUuc2V0KHRoaXMubGFiZWxzW2ldLCAnb3BlbicsIGZhbHNlKTtcbiAgICAgICAgICAgIFZ1ZS5zZXQodGhpcy5sYWJlbHNbaV0sICdzZWxlY3RlZCcsIGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBsYWJlbCB0cmVlIGNhbiBiZSB1c2VkIGluIGEgbGFiZWwtdHJlZXMgY29tcG9uZW50IG9yIGFzIGEgc2luZ2xlIGxhYmVsXG4gICAgICAgIC8vIHRyZWUuIEluIGEgbGFiZWwtdHJlZXMgY29tcG9uZW50IG9ubHkgb25lIGxhYmVsIGNhbiBiZSBzZWxlY3RlZCBpbiBhbGwgbGFiZWxcbiAgICAgICAgLy8gdHJlZXMgc28gdGhlIHBhcmVudCBoYW5kbGVzIHRoZSBldmVudC4gQSBzaW5nbGUgbGFiZWwgdHJlZSBoYW5kbGVzIHRoZSBldmVudFxuICAgICAgICAvLyBieSBpdHNlbGYuXG4gICAgICAgIGlmICh0aGlzLnN0YW5kYWxvbmUpIHtcbiAgICAgICAgICAgIHRoaXMuJG9uKCdzZWxlY3QnLCB0aGlzLnNlbGVjdExhYmVsKTtcbiAgICAgICAgICAgIHRoaXMuJG9uKCdkZXNlbGVjdCcsIHRoaXMuZGVzZWxlY3RMYWJlbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRwYXJlbnQuJG9uKCdzZWxlY3QnLCB0aGlzLnNlbGVjdExhYmVsKTtcbiAgICAgICAgICAgIHRoaXMuJHBhcmVudC4kb24oJ2Rlc2VsZWN0JywgdGhpcy5kZXNlbGVjdExhYmVsKTtcbiAgICAgICAgICAgIHRoaXMuJHBhcmVudC4kb24oJ2NsZWFyJywgdGhpcy5jbGVhclNlbGVjdGVkTGFiZWxzKTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuIiwiLyoqXG4gKiBBIGNvbXBvbmVudCB0aGF0IGRpc3BsYXlzIGEgc2luZ2xlIGxhYmVsIG9mIGEgbGFiZWwgdHJlZS5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5iaWlnbGUuJGNvbXBvbmVudCgnbGFiZWxUcmVlcy5jb21wb25lbnRzLmxhYmVsVHJlZUxhYmVsJywge1xuICAgIG5hbWU6ICdsYWJlbC10cmVlLWxhYmVsJyxcbiAgICB0ZW1wbGF0ZTogJzxsaSBjbGFzcz1cImxhYmVsLXRyZWUtbGFiZWwgY2ZcIiA6Y2xhc3M9XCJjbGFzc09iamVjdFwiPicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cImxhYmVsLXRyZWUtbGFiZWxfX25hbWVcIiBAY2xpY2s9XCJ0b2dnbGVPcGVuXCI+JyArXG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJsYWJlbC10cmVlLWxhYmVsX19jb2xvclwiIDpzdHlsZT1cImNvbG9yU3R5bGVcIj48L3NwYW4+JyArXG4gICAgICAgICAgICAnPHNwYW4gdi10ZXh0PVwibGFiZWwubmFtZVwiIEBjbGljay5zdG9wPVwidG9nZ2xlU2VsZWN0XCI+PC9zcGFuPicgK1xuICAgICAgICAgICAgJzxzcGFuIHYtaWY9XCJzaG93RmF2b3VyaXRlXCIgY2xhc3M9XCJsYWJlbC10cmVlLWxhYmVsX19mYXZvdXJpdGVcIiBAY2xpY2suc3RvcD1cInRvZ2dsZUZhdm91cml0ZVwiPicgK1xuICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImdseXBoaWNvblwiIDpjbGFzcz1cImZhdm91cml0ZUNsYXNzXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCIgdGl0bGU9XCJcIj48L3NwYW4+JyArXG4gICAgICAgICAgICAnPC9zcGFuPicgK1xuICAgICAgICAgICAgJzxidXR0b24gdi1pZj1cImRlbGV0YWJsZVwiIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImNsb3NlIGxhYmVsLXRyZWUtbGFiZWxfX2RlbGV0ZVwiIDp0aXRsZT1cImRlbGV0ZVRpdGxlXCIgQGNsaWNrLnN0b3A9XCJkZWxldGVUaGlzXCI+PHNwYW4gYXJpYS1oaWRkZW49XCJ0cnVlXCI+JnRpbWVzOzwvc3Bhbj48L2J1dHRvbj4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPHVsIHYtaWY9XCJsYWJlbC5vcGVuXCIgY2xhc3M9XCJsYWJlbC10cmVlX19saXN0XCI+JyArXG4gICAgICAgICAgICAnPGxhYmVsLXRyZWUtbGFiZWwgOmxhYmVsPVwiY2hpbGRcIiA6ZGVsZXRhYmxlPVwiZGVsZXRhYmxlXCIgdi1mb3I9XCJjaGlsZCBpbiBsYWJlbC5jaGlsZHJlblwiIEBzZWxlY3Q9XCJlbWl0U2VsZWN0XCIgQGRlc2VsZWN0PVwiZW1pdERlc2VsZWN0XCIgQGRlbGV0ZT1cImVtaXREZWxldGVcIj48L2xhYmVsLXRyZWUtbGFiZWw+JyArXG4gICAgICAgICc8L3VsPicgK1xuICAgICc8L2xpPicsXG4gICAgZGF0YTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmF2b3VyaXRlOiBmYWxzZVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgcHJvcHM6IHtcbiAgICAgICAgbGFiZWw6IHtcbiAgICAgICAgICAgIHR5cGU6IE9iamVjdCxcbiAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBzaG93RmF2b3VyaXRlOiB7XG4gICAgICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICBkZWxldGFibGU6IHtcbiAgICAgICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgY2xhc3NPYmplY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgJ2xhYmVsLXRyZWUtbGFiZWwtLXNlbGVjdGVkJzogdGhpcy5sYWJlbC5zZWxlY3RlZCxcbiAgICAgICAgICAgICAgICAnbGFiZWwtdHJlZS1sYWJlbC0tZXhwYW5kYWJsZSc6IHRoaXMubGFiZWwuY2hpbGRyZW4sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICBjb2xvclN0eWxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogJyMnICsgdGhpcy5sYWJlbC5jb2xvclxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgZmF2b3VyaXRlQ2xhc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgJ2dseXBoaWNvbi1zdGFyLWVtcHR5JzogIXRoaXMuZmF2b3VyaXRlLFxuICAgICAgICAgICAgICAgICdnbHlwaGljb24tc3Rhcic6IHRoaXMuZmF2b3VyaXRlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgZGVsZXRlVGl0bGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAnUmVtb3ZlIGxhYmVsICcgKyB0aGlzLmxhYmVsLm5hbWU7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgdG9nZ2xlU2VsZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMubGFiZWwuc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiRlbWl0KCdzZWxlY3QnLCB0aGlzLmxhYmVsKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kZW1pdCgnZGVzZWxlY3QnLCB0aGlzLmxhYmVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gYSBtZXRob2QgY2FsbGVkICdkZWxldGUnIGRpZG4ndCB3b3JrXG4gICAgICAgIGRlbGV0ZVRoaXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdERlbGV0ZSh0aGlzLmxhYmVsKTtcbiAgICAgICAgfSxcbiAgICAgICAgdG9nZ2xlT3BlbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gSWYgdGhlIGxhYmVsIGNhbm5vdCBiZSBvcGVuZWQsIGl0IHdpbGwgYmUgc2VsZWN0ZWQgaGVyZSBpbnN0ZWFkLlxuICAgICAgICAgICAgaWYgKCF0aGlzLmxhYmVsLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTZWxlY3QoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYWJlbC5vcGVuID0gIXRoaXMubGFiZWwub3BlbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdG9nZ2xlRmF2b3VyaXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmZhdm91cml0ZSA9ICF0aGlzLmZhdm91cml0ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW1pdFNlbGVjdDogZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICAvLyBidWJibGUgdGhlIGV2ZW50IHVwd2FyZHNcbiAgICAgICAgICAgIHRoaXMuJGVtaXQoJ3NlbGVjdCcsIGxhYmVsKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW1pdERlc2VsZWN0OiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIC8vIGJ1YmJsZSB0aGUgZXZlbnQgdXB3YXJkc1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgnZGVzZWxlY3QnLCBsYWJlbCk7XG4gICAgICAgIH0sXG4gICAgICAgIGVtaXREZWxldGU6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgLy8gYnViYmxlIHRoZSBldmVudCB1cHdhcmRzXG4gICAgICAgICAgICB0aGlzLiRlbWl0KCdkZWxldGUnLCBsYWJlbCk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcbiIsIi8qKlxuICogQSBjb21wb25lbnQgdGhhdCBkaXNwbGF5cyBhIHR5cGVhaGVhZCB0byBmaW5kIGxhYmVscy5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5iaWlnbGUuJGNvbXBvbmVudCgnbGFiZWxUcmVlcy5jb21wb25lbnRzLmxhYmVsVHlwZWFoZWFkJywge1xuICAgIHRlbXBsYXRlOiAnPHR5cGVhaGVhZCBjbGFzcz1cImxhYmVsLXR5cGVhaGVhZCBjbGVhcmZpeFwiIDpkYXRhPVwibGFiZWxzXCIgOnBsYWNlaG9sZGVyPVwicGxhY2Vob2xkZXJcIiA6b24taGl0PVwic2VsZWN0TGFiZWxcIiA6dGVtcGxhdGU9XCJ0ZW1wbGF0ZVwiIDpkaXNhYmxlZD1cImRpc2FibGVkXCIgOnZhbHVlPVwidmFsdWVcIiBtYXRjaC1wcm9wZXJ0eT1cIm5hbWVcIj48L3R5cGVhaGVhZD4nLFxuICAgIGRhdGE6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRlbXBsYXRlOiAne3tpdGVtLm5hbWV9fScsXG4gICAgICAgIH07XG4gICAgfSxcbiAgICBjb21wb25lbnRzOiB7XG4gICAgICAgIHR5cGVhaGVhZDogVnVlU3RyYXAudHlwZWFoZWFkLFxuICAgIH0sXG4gICAgcHJvcHM6IHtcbiAgICAgICAgbGFiZWxzOiB7XG4gICAgICAgICAgICB0eXBlOiBBcnJheSxcbiAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBwbGFjZWhvbGRlcjoge1xuICAgICAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICAgICAgZGVmYXVsdDogJ0xhYmVsIG5hbWUnLFxuICAgICAgICB9LFxuICAgICAgICBkaXNhYmxlZDoge1xuICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICAgICAgZGVmYXVsdDogJycsXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIHNlbGVjdExhYmVsOiBmdW5jdGlvbiAobGFiZWwsIHR5cGVhaGVhZCkge1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgnc2VsZWN0JywgbGFiZWwpO1xuICAgICAgICAgICAgdHlwZWFoZWFkLnJlc2V0KCk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcbiIsIi8qKlxuICogQSBjb21wb25lbnQgZm9yIGEgZm9ybSB0byBtYW51YWxseSBjcmVhdGUgYSBuZXcgbGFiZWwgZm9yIGEgbGFiZWwgdHJlZVxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbmJpaWdsZS4kY29tcG9uZW50KCdsYWJlbFRyZWVzLmNvbXBvbmVudHMubWFudWFsTGFiZWxGb3JtJywge1xuICAgIHByb3BzOiB7XG4gICAgICAgIGxhYmVsczoge1xuICAgICAgICAgICAgdHlwZTogQXJyYXksXG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgY29sb3I6IHtcbiAgICAgICAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgICAgICAgIGRlZmF1bHQ6ICcnLFxuICAgICAgICB9LFxuICAgICAgICBwYXJlbnQ6IHtcbiAgICAgICAgICAgIHR5cGU6IE9iamVjdCxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGwsXG4gICAgICAgIH0sXG4gICAgICAgIG5hbWU6IHtcbiAgICAgICAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgICAgICAgIGRlZmF1bHQ6ICcnLFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgY29tcG9uZW50czoge1xuICAgICAgICBsYWJlbFR5cGVhaGVhZDogYmlpZ2xlLiRyZXF1aXJlKCdsYWJlbFRyZWVzLmNvbXBvbmVudHMubGFiZWxUeXBlYWhlYWQnKSxcbiAgICB9LFxuICAgIGNvbXB1dGVkOiB7XG4gICAgICAgIHNlbGVjdGVkQ29sb3I6IHtcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbG9yO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24gKGNvbG9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kZW1pdCgnY29sb3InLCBjb2xvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHNlbGVjdGVkTmFtZToge1xuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubmFtZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kZW1pdCgnbmFtZScsIG5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBzZWxlY3RlZFBhcmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50ID8gdGhpcy5wYXJlbnQubmFtZSA6ICcnO1xuICAgICAgICB9LFxuICAgICAgICBoYXNOb0xhYmVsczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFiZWxzLmxlbmd0aCA9PT0gMDtcbiAgICAgICAgfSxcbiAgICAgICAgaGFzTm9QYXJlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhdGhpcy5wYXJlbnQ7XG4gICAgICAgIH0sXG4gICAgICAgIGhhc05vTmFtZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICF0aGlzLm5hbWU7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgcmVmcmVzaENvbG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkQ29sb3IgPSBiaWlnbGUuJHJlcXVpcmUoJ2xhYmVsVHJlZXMucmFuZG9tQ29sb3InKSgpO1xuICAgICAgICB9LFxuICAgICAgICByZXNldFBhcmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgncGFyZW50JywgbnVsbCk7XG4gICAgICAgIH0sXG4gICAgICAgIHNlbGVjdExhYmVsOiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMuJGVtaXQoJ3BhcmVudCcsIGxhYmVsKTtcbiAgICAgICAgfSxcbiAgICAgICAgc3VibWl0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLiRlbWl0KCdzdWJtaXQnKTtcbiAgICAgICAgfVxuICAgIH0sXG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
