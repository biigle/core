/**
 * View model for the label tree import container
 */
biigle.$viewModel('label-tree-import-container', function (element) {
    var messages = biigle.$require('messages.store');
    var importApi = biigle.$require('sync.api.import');
    var importToken = biigle.$require('sync.importToken');
    var adminRoleId = biigle.$require('sync.adminRoleId');

    new Vue({
        el: element,
        mixins: [biigle.$require('sync.mixins.importContainer')],
        data: {
            labelTreeCandidates: biigle.$require('sync.labelTreeCandidates'),
            labelCandidates: biigle.$require('sync.labelCandidates'),
            conflictingParents: biigle.$require('sync.conflictingParents'),
            userCandidates: biigle.$require('sync.userCandidates'),
            chosenLabelTrees: [],
            chosenLabels: [],
        },
        computed: {
            userMap: function () {
                var map = {};
                this.userCandidates.forEach(function (user) {
                    user.name = user.firstname + ' ' + user.lastname;
                    map[user.id] = user;
                });

                return map;
            },
            chosenUsers: function () {
                var self = this;
                var chosenIds = [];
                this.chosenLabelTrees.forEach(function (labelTree) {
                    labelTree.members.forEach(function (member) {
                        if (member.role_id === adminRoleId && chosenIds.indexOf(member.id) === -1) {
                            chosenIds.push(member.id);
                        }
                    });
                });

                return chosenIds.filter(function (id) {
                        return self.userMap.hasOwnProperty(id);
                    })
                    .map(function (id) {
                        return self.userMap[id];
                    });
            },
            hasChosenUsers: function () {
                return this.chosenUsers.length > 0;
            },
            labelMap: function () {
                var map = {};
                biigle.$require('sync.importLabels').forEach(function (label) {
                    map[label.id] = label;
                });

                return map;
            },
            labels: function () {
                return this.labelCandidates.map(function (label) {
                    label.description = 'Label tree: ' + label.label_tree_name;
                    return label;
                });
            },
            conflictingParentMap: function () {
                var map = {};
                this.conflictingParents.forEach(function (label) {
                    map[label.id] = label;
                });

                return map;
            },
            conflictingLabels: function () {
                return this.chosenLabels
                    .filter(function (label) {
                        return label.hasOwnProperty('conflicting_name') || label.hasOwnProperty('conflicting_parent_id');
                    })
                    .map(function (label) {
                        if (label.hasOwnProperty('conflicting_parent_id')) {
                            label.parent = this.labelMap[label.parent_id];
                            label.conflicting_parent = this.conflictingParentMap[label.conflicting_parent_id];
                        }

                        return label;
                    }, this);
            },
            hasConflictingLabels: function () {
                return this.conflictingLabels.length > 0;
            },
            hasNoChosenItems: function () {
                return this.chosenLabelTrees.length === 0 && this.chosenLabels.length === 0;
            },
            hasUnresolvedConflicts: function () {
                var self = this;
                return !this.conflictingLabels.reduce(function (carry, label) {
                    return carry && self.isLabelConflictResolved(label);
                }, true);
            },
            submitTitle: function () {
                if (this.hasNoChosenItems) {
                    return 'Choose label trees or labels to import';
                } else if (this.hasUnresolvedConflicts) {
                    return 'Resolve the label conflicts';
                }

                return 'Perform the import';
            },
            panelClass: function () {
                return {'panel-danger': this.hasUnresolvedConflicts};
            },
            panelBodyClass: function () {
                return {'text-danger': this.hasUnresolvedConflicts};
            },
            chosenLabelTreeIds: function () {
                return this.chosenLabelTrees.map(function (item) {
                    return item.id;
                });
            },
            chosenLabelIds: function () {
                return this.chosenLabels.map(function (item) {
                    return item.id;
                });
            },
            nameConflictResolutions: function () {
                var resolutions = {};
                this.conflictingLabels.forEach(function (label) {
                    if (this.hasLabelConflictingName(label)) {
                        resolutions[label.id] = label.conflicting_name_resolution;
                    }
                }, this);

                return resolutions;
            },
            parentConflictResolutions: function () {
                var resolutions = {};
                this.conflictingLabels.forEach(function (label) {
                    if (this.hasLabelConflictingParent(label)) {
                        resolutions[label.id] = label.conflicting_parent_resolution;
                    }
                }, this);

                return resolutions;
            },
        },
        methods: {
            handleChosenLabelTrees: function (items) {
                this.chosenLabelTrees = items;
            },
            handleChosenLabels: function (items) {
                this.chosenLabels = items;
            },
            hasLabelConflictingName: function (label) {
                return label.hasOwnProperty('conflicting_name');
            },
            hasLabelConflictingParent: function (label) {
                return label.hasOwnProperty('conflicting_parent_id');
            },
            isLabelConflictResolved: function (label) {
                return (!this.hasLabelConflictingName(label) || label.conflicting_name_resolution) &&
                    (!this.hasLabelConflictingParent(label) || label.conflicting_parent_resolution);
            },
            chooseAllImportInformation: function () {
                this.conflictingLabels.forEach(function (label) {
                    this.chooseImportParent(label);
                    this.chooseImportName(label);
                }, this);
            },
            chooseAllExistingInformation: function () {
                this.conflictingLabels.forEach(function (label) {
                    this.chooseExistingParent(label);
                    this.chooseExistingName(label);
                }, this);
            },
            chooseImportParent: function (label) {
                if (this.hasLabelConflictingParent(label)) {
                    Vue.set(label, 'conflicting_parent_resolution', 'import');
                }
            },
            chooseImportName: function (label) {
                if (this.hasLabelConflictingName(label)) {
                    Vue.set(label, 'conflicting_name_resolution', 'import');
                }
            },
            chooseExistingParent: function (label) {
                if (this.hasLabelConflictingParent(label)) {
                    Vue.set(label, 'conflicting_parent_resolution', 'existing');
                }
            },
            chooseExistingName: function (label) {
                if (this.hasLabelConflictingName(label)) {
                    Vue.set(label, 'conflicting_name_resolution', 'existing');
                }
            },
            performImport: function () {
                this.startLoading();
                var payload = {};
                if (this.chosenLabelTreeIds.length < this.labelTreeCandidates.length) {
                    payload.only_label_trees = this.chosenLabelTreeIds;
                }

                if (this.chosenLabelIds.length < this.labelCandidates.length) {
                    payload.only_labels = this.chosenLabelIds;
                }

                if (this.hasConflictingLabels) {
                    payload.name_conflicts = this.nameConflictResolutions;
                    payload.parent_conflicts = this.parentConflictResolutions;
                }

                importApi.update({token: importToken}, payload)
                    .then(this.importSuccess, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
        },
    });
});
