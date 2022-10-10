<script>
import Dropdown from 'uiv/dist/Dropdown';
import EditorMixin from '../core/mixins/editor';
import LabelTreesApi from '../core/api/labelTree';
import LoaderMixin from '../core/mixins/loader';
import Messages from '../core/messages/store';
import {handleErrorResponse} from '../core/messages/store';

/**
 * The panel for editing the title information of a label tree
 */
export default {
    mixins: [
        LoaderMixin,
        EditorMixin,
    ],
    components: {
        dropdown: Dropdown,
    },
    data() {
        return {
            labelTree: null,
            name: null,
            description: null,
            visibility_id: null,
            userId: null,
            redirectUrl: null,
            privateVisibilityId: null,
        };
    },
    computed: {
        isPrivate() {
            return this.labelTree.visibility_id === this.privateVisibilityId;
        },
        hasDescription() {
            return !!this.description;
        },
        isChanged() {
            return this.name !== this.labelTree.name || this.description !== this.labelTree.description || parseInt(this.visibility_id) !== this.labelTree.visibility_id;
        },
        disabledClass() {
            return this.loading ? 'disabled' : '';
        },
    },
    methods: {
        discardChanges() {
            this.finishEditing();
            this.name = this.labelTree.name;
            this.description = this.labelTree.description;
            this.visibility_id = this.labelTree.visibility_id;
        },
        leaveTree() {
            let confirmed = confirm(`Do you really want to revoke your membership of label tree '${this.labelTree.name}'?`);

            if (confirmed) {
                this.startLoading();
                LabelTreesApi.removeUser({
                    id: this.labelTree.id,
                    user_id: this.userId,
                })
                .then(this.treeLeft, handleErrorResponse)
                .finally(this.finishLoading);
            }
        },
        treeLeft() {
            if (this.isPrivate) {
                Messages.success('You left the label tree. Redirecting...');
                setTimeout(() => location.href = this.redirectUrl, 2000);
            } else {
                location.reload();
            }
        },
        deleteTree() {
            let confirmed = confirm(`Do you really want to delete the label tree '${this.labelTree.name}'?`);

            if (confirmed) {
                this.startLoading();
                LabelTreesApi.delete({id: this.labelTree.id})
                    .then(this.treeDeleted, handleErrorResponse)
                    .finally(this.finishLoading);
            }
        },
        treeDeleted() {
            Messages.success('The label tree was deleted. Redirecting...');
            setTimeout(() => location.href = this.redirectUrl, 2000);
        },
        saveChanges() {
            this.startLoading();
            LabelTreesApi.update({id: this.labelTree.id}, {
                    name: this.name,
                    description: this.description,
                    visibility_id: this.visibility_id,
                })
                .then(this.changesSaved, handleErrorResponse)
                .finally(this.finishLoading);
        },
        changesSaved() {
            this.labelTree.name = this.name;
            this.labelTree.description = this.description;
            this.labelTree.visibility_id = parseInt(this.visibility_id);
            this.finishEditing();
        },
    },
    created() {
        this.privateVisibilityId = biigle.$require('labelTrees.privateVisibilityId');
        this.labelTree = biigle.$require('labelTrees.labelTree');
        this.userId = biigle.$require('labelTrees.userId');
        this.redirectUrl = biigle.$require('labelTrees.redirectUrl');
        // Duplicate the label tree properties so they can be changed and possibly
        // discarded without affecting the original label tree object.
        this.name = this.labelTree.name;
        this.description = this.labelTree.description;
        this.visibility_id = this.labelTree.visibility_id;
    },
};
</script>
