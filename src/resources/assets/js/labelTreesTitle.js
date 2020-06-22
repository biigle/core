/**
 * The panel for editing the title information of a label tree
 */
biigle.$viewModel('label-trees-title', function (element) {
    var messages = biigle.$require('messages.store');
    var labelTree = biigle.$require('labelTrees.labelTree');
    var privateId = biigle.$require('labelTrees.privateVisibilityId');
    var labelTreeApi = biigle.$require('api.labelTree');

    new Vue({
        el: element,
        mixins: [
            biigle.$require('core.mixins.loader'),
            biigle.$require('core.mixins.editor'),
        ],
        data: {
            labelTree: labelTree,
            // Duplicate the label tree properties so they can be changed and possibly
            // discarded without affecting the original label tree object.
            name: labelTree.name,
            description: labelTree.description,
            visibility_id: labelTree.visibility_id,
        },
        computed: {
            isPrivate() {
                return this.labelTree.visibility_id === privateId;
            },
            hasDescription() {
                return !!this.description;
            },
            isChanged() {
                return this.name !== this.labelTree.name || this.description !== this.labelTree.description || parseInt(this.visibility_id) !== this.labelTree.visibility_id;
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
                var confirmed = confirm('Do you really want to revoke your membership of label tree "' + this.labelTree.name + '"?');

                if (confirmed) {
                    this.startLoading();
                    labelTreeApi.removeUser({
                        id: this.labelTree.id,
                        user_id: biigle.$require('labelTrees.userId'),
                    })
                    .then(this.treeLeft, messages.handleErrorResponse)
                    .finally(this.finishLoading);
                }
            },
            treeLeft() {
                if (this.isPrivate) {
                    messages.success('You left the label tree. Redirecting...');
                    setTimeout(function () {
                        location.href = biigle.$require('labelTrees.redirectUrl');
                     }, 2000);
                } else {
                    location.reload();
                }
            },
            deleteTree() {
                var confirmed = confirm('Do you really want to delete the label tree ' + this.labelTree.name + '?');

                if (confirmed) {
                    this.startLoading();
                    labelTreeApi.delete({id: this.labelTree.id})
                        .then(this.treeDeleted, messages.handleErrorResponse)
                        .finally(this.finishLoading);
                }
            },
            treeDeleted() {
                messages.success('The label tree was deleted. Redirecting...');
                setTimeout(function () {
                    location.href = biigle.$require('labelTrees.redirectUrl');
                 }, 2000);
            },
            saveChanges() {
                this.startLoading();
                labelTreeApi.update({id: this.labelTree.id}, {
                        name: this.name,
                        description: this.description,
                        visibility_id: this.visibility_id,
                    })
                    .then(this.changesSaved, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
            changesSaved() {
                this.labelTree.name = this.name;
                this.labelTree.description = this.description;
                this.labelTree.visibility_id = parseInt(this.visibility_id);
                this.finishEditing();
            }
        }
    });
});
