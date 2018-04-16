/**
 * An extended mixin for the label tree and volume import view models
 *
 * @type {Object}
 */
biigle.$component('sync.mixins.labelTreeImportContainer', {
    data: function () {
        return {
            success: false,
            userCandidates: [],
            conflictingParents: [],
            chosenLabels: [],
        };
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
        labelMap: function () {
            var map = {};
            biigle.$require('sync.importLabels').forEach(function (label) {
                map[label.id] = label;
            });

            return map;
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
        hasUnresolvedConflicts: function () {
            var self = this;
            return !this.conflictingLabels.reduce(function (carry, label) {
                return carry && self.isLabelConflictResolved(label);
            }, true);
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
        panelClass: function () {
            return {'panel-danger': this.hasUnresolvedConflicts};
        },
        panelBodyClass: function () {
            return {'text-danger': this.hasUnresolvedConflicts};
        },
    },
    methods: {
        importSuccess: function () {
            this.success = true;
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
    },
});
