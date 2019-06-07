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
        mixins: [
            biigle.$require('sync.mixins.importContainer'),
            biigle.$require('sync.mixins.labelTreeImportContainer'),
        ],
        data: {
            labelCandidates: biigle.$require('sync.labelCandidates'),
            conflictingParents: biigle.$require('sync.conflictingParents'),
            userCandidates: biigle.$require('sync.userCandidates'),
            chosenLabelTrees: [],
            chosenLabels: [],
        },
        computed: {
            labelTreeCandidates: function () {
                return biigle.$require('sync.labelTreeCandidates').map(function (tree) {
                    if (tree.version) {
                        tree.name = tree.name + ' @ ' + tree.version.name;
                    }

                    return tree;
                });
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
            labels: function () {
                return this.labelCandidates.map(function (label) {
                    label.description = 'Label tree: ' + label.label_tree_name;
                    return label;
                });
            },
            hasNoChosenItems: function () {
                return this.chosenLabelTrees.length === 0 && this.chosenLabels.length === 0;
            },
            submitTitle: function () {
                if (this.hasNoChosenItems) {
                    return 'Choose label trees or labels to import';
                } else if (this.hasUnresolvedConflicts) {
                    return 'Resolve the label conflicts';
                }

                return 'Perform the import';
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
        },
        methods: {
            handleChosenLabelTrees: function (items) {
                this.chosenLabelTrees = items;
            },
            handleChosenLabels: function (items) {
                this.chosenLabels = items;
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
