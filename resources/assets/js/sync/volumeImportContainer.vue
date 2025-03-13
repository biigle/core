<script>
import ImportApi from './api/import.js';
import ImportContainer from './mixins/importContainer.vue';
import LabelTreeImportContainer from './mixins/labelTreeImportContainer.vue';
import ProjectsApi from '@/core/api/projects.js';
import Typeahead from '@/core/components/typeahead.vue';
import {handleErrorResponse} from '@/core/messages/store.js';

/**
 * View model for the volume import container
 */
export default {
    compatConfig: { WATCH_ARRAY: false },
    mixins: [
        ImportContainer,
        LabelTreeImportContainer,
    ],
    components: {
        typeahead: Typeahead,
    },
    data() {
        return {
            importToken: null,
            adminRoleId: null,
            volumeCandidates: [],
            labelCandidates: [],
            conflictingParents: [],
            userCandidates: [],
            chosenVolumes: [],
            labelTreeCandidates: [],
            availableProjects: [],
            targetProject: null,
        };
    },
    computed: {
        volumes() {
            return this.volumeCandidates.map(function (volume) {
                volume.new_url = volume.url;

                if (volume.media_type_name === 'image') {
                    volume.icon = 'image';
                } else if (volume.media_type_name === 'video') {
                    volume.icon = 'film';
                }

                return volume;
            });
        },
        labelTreeMap() {
            let map = {};
            this.labelTreeCandidates.forEach(function (tree) {
                map[tree.id] = tree;
            });

            return map;
        },
        labelCandidateMap() {
            let map = {};
            this.labelCandidates.forEach(function (label) {
                map[label.id] = label;
            });

            return map;
        },
        chosenUsers() {
            let chosenIds = [];
            this.chosenVolumes.forEach(function (volume) {
                volume.users.forEach(function (id) {
                    if (chosenIds.indexOf(id) === -1) {
                        chosenIds.push(id);
                    }
                });
            });

            return chosenIds
                .filter((id) => this.userMap.hasOwnProperty(id))
                .map((id) => this.userMap[id]);
        },
        hasChosenUsers() {
            return this.chosenUsers.length > 0;
        },
        chosenLabelTrees() {
            let chosenIds = [];
            this.chosenVolumes.forEach(function (volume) {
                volume.label_trees.forEach(function (id) {
                    if (chosenIds.indexOf(id) === -1) {
                        chosenIds.push(id);
                    }
                });
            });

            return chosenIds
                .filter((id) => this.labelTreeMap.hasOwnProperty(id))
                .map((id) => this.labelTreeMap[id]);
        },
        hasChosenLabelTrees() {
            return this.chosenLabelTrees.length > 0;
        },
        chosenLabelTreeAdmins() {
            let chosenIds = [];
            this.chosenLabelTrees.forEach((labelTree) => {
                labelTree.members.forEach((member) => {
                    if (member.role_id === this.adminRoleId && chosenIds.indexOf(member.id) === -1) {
                        chosenIds.push(member.id);
                    }
                });
            });

            return chosenIds
                .filter((id) => this.userMap.hasOwnProperty(id))
                .map((id) => this.userMap[id]);
        },
        hasChosenLabelTreeAdmins() {
            return this.chosenLabelTreeAdmins.length > 0;
        },
        chosenLabelsOverride() {
            let chosenIds = [];
            this.chosenVolumes.forEach(function (volume) {
                volume.labels.forEach(function (id) {
                    if (chosenIds.indexOf(id) === -1) {
                        chosenIds.push(id);
                    }
                });
            });

            return chosenIds
                .filter((id) => this.labelCandidateMap.hasOwnProperty(id))
                .map((id) => this.labelCandidateMap[id]);
        },
        hasChosenLabels() {
            return this.chosenLabels.length > 0;
        },
        hasNoChosenItems() {
            return this.chosenVolumes.length === 0;
        },
        submitTitle() {
            if (this.hasNoChosenItems) {
                return 'Choose volumes to import';
            } else if (this.hasUnresolvedConflicts) {
                return 'Resolve the label conflicts';
            } else if (this.hasNoSelectedProject) {
                return 'Select a target project';
            }

            return 'Perform the import';
        },
        hasNoSelectedProject() {
            return this.targetProject === null;
        },
        cantDoImport() {
            return this.loading || this.hasNoChosenItems || this.hasUnresolvedConflicts || this.hasNoSelectedProject;
        },
        chosenVolumeIds() {
            return this.chosenVolumes.map((volume) => volume.id);
        },
        newVolumeUrls() {
            let map = {};
            this.chosenVolumes.forEach(function (volume) {
                if (volume.url !== volume.new_url) {
                    map[volume.id] = volume.new_url;
                }
            });

            return map;
        },
        hasNewVolumeUrls() {
            return this.chosenVolumes.reduce(function (carry, volume) {
                return carry || volume.url !== volume.new_url;
            }, false);
        },
    },
    methods: {
        selectTargetProject(item) {
            this.targetProject = item;
        },
        handleChosenVolumes(items) {
            this.chosenVolumes = items;
        },
        performImport() {
            this.startLoading();
            let payload = {
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

            ImportApi.update({token: this.importToken}, payload)
                .then(this.importSuccess, handleErrorResponse)
                .finally(this.finishLoading);
        },
    },
    watch: {
        hasNoChosenItems(hasNo) {
            if (this.availableProjects.length === 0 && !hasNo) {
                ProjectsApi.query().then((response) => {
                    this.availableProjects = response.body;
                }, handleErrorResponse);
            }
        },
        chosenLabelsOverride(labels) {
            this.chosenLabels = labels;
        },
    },
    created() {
        this.importToken = biigle.$require('sync.importToken');
        this.adminRoleId = biigle.$require('sync.adminRoleId');
        this.volumeCandidates = biigle.$require('sync.volumeCandidates');
        this.labelCandidates = biigle.$require('sync.labelCandidates');
        this.conflictingParents = biigle.$require('sync.conflictingParents');
        this.userCandidates = biigle.$require('sync.userCandidates');
        this.labelTreeCandidates = biigle.$require('sync.labelTreeCandidates')
            .map(function (tree) {
                if (tree.version) {
                    tree.name = tree.name + ' @ ' + tree.version.name;
                }

                return tree;
            });
    },
};
</script>
