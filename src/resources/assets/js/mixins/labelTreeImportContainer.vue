<script>
/**
 * An extended mixin for the label tree and volume import view models
 *
 * @type {Object}
 */
export default {
    data() {
        return {
            success: false,
            userCandidates: [],
            conflictingParents: [],
            chosenLabels: [],
            importLabels: [],
        };
    },
    computed: {
        userMap() {
            let map = {};
            this.userCandidates.forEach(function (user) {
                user.name = user.firstname + ' ' + user.lastname;
                map[user.id] = user;
            });

            return map;
        },
        labelMap() {
            let map = {};
            this.importLabels.forEach(function (label) {
                map[label.id] = label;
            });

            return map;
        },
        conflictingParentMap() {
            let map = {};
            this.conflictingParents.forEach(function (label) {
                map[label.id] = label;
            });

            return map;
        },
        conflictingLabels() {
            return this.chosenLabels
                .filter(function (label) {
                    return label.hasOwnProperty('conflicting_name') || label.hasOwnProperty('conflicting_parent_id');
                })
                .map((label) => {
                    if (label.hasOwnProperty('conflicting_parent_id')) {
                        label.parent = this.labelMap[label.parent_id];
                        label.conflicting_parent = this.conflictingParentMap[label.conflicting_parent_id];
                    }

                    return label;
                });
        },
        hasConflictingLabels() {
            return this.conflictingLabels.length > 0;
        },
        hasUnresolvedConflicts() {
            return !this.conflictingLabels.reduce((carry, label) => {
                return carry && this.isLabelConflictResolved(label);
            }, true);
        },
        nameConflictResolutions() {
            let resolutions = {};
            this.conflictingLabels.forEach((label) => {
                if (this.hasLabelConflictingName(label)) {
                    resolutions[label.id] = label.conflicting_name_resolution;
                }
            });

            return resolutions;
        },
        parentConflictResolutions() {
            let resolutions = {};
            this.conflictingLabels.forEach((label) => {
                if (this.hasLabelConflictingParent(label)) {
                    resolutions[label.id] = label.conflicting_parent_resolution;
                }
            });

            return resolutions;
        },
        panelClass() {
            return {'panel-danger': this.hasUnresolvedConflicts};
        },
        panelBodyClass() {
            return {'text-danger': this.hasUnresolvedConflicts};
        },
    },
    methods: {
        importSuccess() {
            this.success = true;
        },
        hasLabelConflictingName(label) {
            return label.hasOwnProperty('conflicting_name');
        },
        hasLabelConflictingParent(label) {
            return label.hasOwnProperty('conflicting_parent_id');
        },
        isLabelConflictResolved(label) {
            return (!this.hasLabelConflictingName(label) || label.conflicting_name_resolution) &&
                (!this.hasLabelConflictingParent(label) || label.conflicting_parent_resolution);
        },
        chooseAllImportInformation() {
            this.conflictingLabels.forEach((label) => {
                this.chooseImportParent(label);
                this.chooseImportName(label);
            });
        },
        chooseAllExistingInformation() {
            this.conflictingLabels.forEach((label) => {
                this.chooseExistingParent(label);
                this.chooseExistingName(label);
            });
        },
        chooseImportParent(label) {
            if (this.hasLabelConflictingParent(label)) {
                Vue.set(label, 'conflicting_parent_resolution', 'import');
            }
        },
        chooseImportName(label) {
            if (this.hasLabelConflictingName(label)) {
                Vue.set(label, 'conflicting_name_resolution', 'import');
            }
        },
        chooseExistingParent(label) {
            if (this.hasLabelConflictingParent(label)) {
                Vue.set(label, 'conflicting_parent_resolution', 'existing');
            }
        },
        chooseExistingName(label) {
            if (this.hasLabelConflictingName(label)) {
                Vue.set(label, 'conflicting_name_resolution', 'existing');
            }
        },
    },
    created() {
        this.importLabels = biigle.$require('sync.importLabels');
    },
};
</script>
