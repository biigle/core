/**
 * The panel for editing the title information of a label tree
 */
biigle.$viewModel('label-trees-title', function (element) {
    var messages = biigle.$require('messages.store');
    var labelTree = biigle.$require('labelTrees.labelTree');
    var privateId = biigle.$require('labelTrees.privateVisibilityId');
    var labelTreeUserApi = biigle.$require('api.labelTreeUser');
    var labelTreeApi = biigle.$require('api.labelTree');


    new Vue({
        el: element,
        mixins: [biigle.$require('labelTrees.mixins.loader')],
        data: {
            editing: false,
            name: labelTree.name,
            description: labelTree.description,
            visibility_id: labelTree.visibility_id,
        },
        components: {
        },
        computed: {
            isPrivate: function () {
                return parseInt(this.visibility_id) === privateId;
            },
            hasDescription: function () {
                return !!this.description.length;
            },
            isChanged: function () {
                return this.name !== labelTree.name || this.description !== labelTree.description || parseInt(this.visibility_id) !== labelTree.visibility_id;
            },
        },
        methods: {
            startEditing: function () {
                this.editing = true;
            },
            discardChanges: function () {
                this.editing = false;
                this.name = labelTree.name;
                this.description = labelTree.description;
                this.visibility_id = labelTree.visibility_id;
            },
            leaveTree: function () {
                var confirmed = confirm('Do you really want to leave the label tree ' + labelTree.name + '?');

                if (confirmed) {
                    this.startLoading();
                    labelTreeUserApi.delete({
                        label_tree_id: labelTree.id,
                        id: biigle.$require('labelTrees.userId'),
                    })
                    .then(this.treeLeft, messages.handleErrorResponse)
                    .finally(this.finishLoading);
                }
            },
            treeLeft: function () {
                if (this.isPrivate) {
                    messages.success('You left the label tree. Redirecting...');
                    setTimeout(function () {
                        location.href = biigle.$require('labelTrees.redirectUrl');
                     }, 2000);
                } else {
                    location.reload();
                }
            },
            deleteTree: function () {
                var confirmed = confirm('Do you really want to delete the label tree ' + labelTree.name + '?');

                if (confirmed) {
                    this.startLoading();
                    labelTreeApi.delete({id: labelTree.id})
                        .then(this.treeDeleted, messages.handleErrorResponse)
                        .finally(this.finishLoading);
                }
            },
            treeDeleted: function () {
                messages.success('The label tree was deleted. Redirecting...');
                setTimeout(function () {
                    location.href = biigle.$require('labelTrees.redirectUrl');
                 }, 2000);
            },
            saveChanges: function () {
                this.startLoading();
                labelTreeApi.update({id: labelTree.id}, {
                        name: this.name,
                        description: this.description,
                        visibility_id: this.visibility_id,
                    })
                    .then(this.changesSaved, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
            changesSaved: function () {
                labelTree.name = this.name;
                labelTree.description = this.description;
                labelTree.visibility_id = parseInt(this.visibility_id);
                this.editing = false;
            }
        }
    });
});
