<script>
import ImportApi from './api/import';
import ImportContainer from './mixins/importContainer';
import LabelTreeImportContainer from './mixins/labelTreeImportContainer';
import {handleErrorResponse} from '../core/messages/store';

/**
 * View model for the label tree import container
 */
export default{
    mixins: [
        ImportContainer,
        LabelTreeImportContainer,
    ],
    data() {
        return {
            importToken: null,
            adminRoleId: null,
            labelCandidates: [],
            conflictingParents: [],
            userCandidates: [],
            labelTreeCandidates: [],
            chosenLabelTrees: [],
            chosenLabels: [],
        };
    },
    computed: {
        chosenUsers() {
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
        hasChosenUsers() {
            return this.chosenUsers.length > 0;
        },
        labels() {
            return this.labelCandidates.map(function (label) {
                label.description = 'Label tree: ' + label.label_tree_name;

                return label;
            });
        },
        hasNoChosenItems() {
            return this.chosenLabelTrees.length === 0 && this.chosenLabels.length === 0;
        },
        submitTitle() {
            if (this.hasNoChosenItems) {
                return 'Choose label trees or labels to import';
            } else if (this.hasUnresolvedConflicts) {
                return 'Resolve the label conflicts';
            }

            return 'Perform the import';
        },
        chosenLabelTreeIds() {
            return this.chosenLabelTrees.map((item) => item.id);
        },
        chosenLabelIds() {
            return this.chosenLabels.map((item) => item.id);
        },
    },
    methods: {
        handleChosenLabelTrees(items) {
            this.chosenLabelTrees = items;
        },
        handleChosenLabels(items) {
            this.chosenLabels = items;
        },
        performImport() {
            this.startLoading();
            let payload = {};
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

            ImportApi.update({token: this.importToken}, payload)
                .then(this.importSuccess, handleErrorResponse)
                .finally(this.finishLoading);
        },
    },
    created() {
        this.importToken = biigle.$require('sync.importToken');
        this.adminRoleId = biigle.$require('sync.adminRoleId');
        this.labelCandidates = biigle.$require('sync.labelCandidates');
        this.conflictingParents = biigle.$require('sync.conflictingParents');
        this.userCandidates = biigle.$require('sync.userCandidates');
        this.labelTreeCandidates =
            biigle.$require('sync.labelTreeCandidates').map(function (tree) {
                if (tree.version) {
                    tree.name = tree.name + ' @ ' + tree.version.name;
                }

                return tree;
            });
    },
};
</script>
