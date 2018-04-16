/**
 * View model for the volume import container
 */
biigle.$viewModel('volume-import-container', function (element) {
    var messages = biigle.$require('messages.store');
    var importApi = biigle.$require('sync.api.import');
    var projectsApi = biigle.$require('api.projects');
    var importToken = biigle.$require('sync.importToken');
    var adminRoleId = biigle.$require('sync.adminRoleId');

    new Vue({
        el: element,
        mixins: [
            biigle.$require('sync.mixins.importContainer'),
            biigle.$require('sync.mixins.labelTreeImportContainer'),
        ],
        components: {
            typeahead: biigle.$require('core.components.typeahead'),
        },
        data: {
            volumeCandidates: biigle.$require('sync.volumeCandidates'),
            labelTreeCandidates: biigle.$require('sync.labelTreeCandidates'),
            labelCandidates: biigle.$require('sync.labelCandidates'),
            conflictingParents: biigle.$require('sync.conflictingParents'),
            userCandidates: biigle.$require('sync.userCandidates'),
            chosenVolumes: [],
            typeaheadTemplate: '<span v-text="item.name"></span><br><small v-text="item.description"></small>',
            availableProjects: [],
            targetProject: null,
        },
        computed: {
            volumes: function () {
                return this.volumeCandidates.map(function (volume) {
                    Vue.set(volume, 'new_url', volume.url);
                    return volume;
                });
            },
            labelTreeMap: function () {
                var map = {};
                this.labelTreeCandidates.forEach(function (tree) {
                    map[tree.id] = tree;
                });

                return map;
            },
            labelCandidateMap: function () {
                var map = {};
                this.labelCandidates.forEach(function (label) {
                    map[label.id] = label;
                });

                return map;
            },
            chosenUsers: function () {
                var self = this;
                var chosenIds = [];
                this.chosenVolumes.forEach(function (volume) {
                    volume.users.forEach(function (id) {
                        if (chosenIds.indexOf(id) === -1) {
                            chosenIds.push(id);
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
            chosenLabelTrees: function () {
                var self = this;
                var chosenIds = [];
                this.chosenVolumes.forEach(function (volume) {
                    volume.label_trees.forEach(function (id) {
                        if (chosenIds.indexOf(id) === -1) {
                            chosenIds.push(id);
                        }
                    });
                });

                return chosenIds.filter(function (id) {
                        return self.labelTreeMap.hasOwnProperty(id);
                    })
                    .map(function (id) {
                        return self.labelTreeMap[id];
                    });
            },
            hasChosenLabelTrees: function () {
                return this.chosenLabelTrees.length > 0;
            },
            chosenLabelTreeAdmins: function () {
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
            hasChosenLabelTreeAdmins: function () {
                return this.chosenLabelTreeAdmins.length > 0;
            },
            chosenLabels: function () {
                var self = this;
                var chosenIds = [];
                this.chosenVolumes.forEach(function (volume) {
                    volume.labels.forEach(function (id) {
                        if (chosenIds.indexOf(id) === -1) {
                            chosenIds.push(id);
                        }
                    });
                });

                return chosenIds.filter(function (id) {
                        return self.labelCandidateMap.hasOwnProperty(id);
                    })
                    .map(function (id) {
                        return self.labelCandidateMap[id];
                    });
            },
            hasChosenLabels: function () {
                return this.chosenLabels.length > 0;
            },
            hasNoChosenItems: function () {
                return this.chosenVolumes.length === 0;
            },
            submitTitle: function () {
                if (this.hasNoChosenItems) {
                    return 'Choose volumes to import';
                } else if (this.hasUnresolvedConflicts) {
                    return 'Resolve the label conflicts';
                } else if (this.hasNoSelectedProject) {
                    return 'Select a target project';
                }

                return 'Perform the import';
            },
            hasNoSelectedProject: function () {
                return this.targetProject === null;
            },
            cantDoImport: function () {
                return this.loading || this.hasNoChosenItems || this.hasUnresolvedConflicts || this.hasNoSelectedProject;
            },
            chosenVolumeIds: function () {
                return this.chosenVolumes.map(function (volume) {
                    return volume.id;
                });
            },
            newVolumeUrls: function () {
                var map = {};
                this.chosenVolumes.forEach(function (volume) {
                    if (volume.url !== volume.new_url) {
                        map[volume.id] = volume.new_url;
                    }
                });

                return map;
            },
            hasNewVolumeUrls: function () {
                return this.chosenVolumes.reduce(function (carry, volume) {
                    return carry || volume.url !== volume.new_url;
                }, false);
            },
        },
        methods: {
            selectTargetProject: function (item) {
                this.targetProject = item;
            },
            handleChosenVolumes: function (items) {
                this.chosenVolumes = items;
            },
            performImport: function () {
                this.startLoading();
                var payload = {
                    project_id: this.targetProject.id,
                };

                if (this.chosenVolumeIds.length < this.volumes.length) {
                    payload.only = this.chosenVolumeIds;
                }

                if (this.hasNewVolumeUrls) {
                    payload.new_urls = this.newVolumeUrls;
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
        watch: {
            hasNoChosenItems: function (hasNo) {
                if (this.availableProjects.length === 0 && !hasNo) {
                    projectsApi.query().bind(this).then(function (response) {
                        this.availableProjects = response.body;
                    }, messages.handleErrorResponse);
                }
            },
        },
    });
});
