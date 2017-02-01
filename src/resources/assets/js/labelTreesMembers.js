/**
 * The panel for editing the members of a label tree
 */
biigle.$viewModel('label-trees-members', function (element) {
    var messages = biigle.$require('messages.store');
    var labelTree = biigle.$require('labelTrees.labelTree');
    var labelTreeApi = biigle.$require('api.labelTree');

    new Vue({
        el: element,
        mixins: [biigle.$require('core.mixins.loader')],
        data: {
            members: biigle.$require('labelTrees.members'),
            roles: biigle.$require('labelTrees.roles'),
            defaultRole: biigle.$require('labelTrees.defaultRoleId'),
            userId: biigle.$require('labelTrees.userId'),
        },
        components: {
            membersPanel: biigle.$require('core.components.membersPanel'),
        },
        computed: {
        },
        methods: {
            attachMember: function (user) {
                this.startLoading();
                var self = this;
                labelTreeApi.addUser({id: labelTree.id}, {
                        id: user.id,
                        role_id: user.role_id,
                    })
                    .then(function () {
                        self.memberAttached(user);
                    }, messages.handleResponseError)
                    .finally(this.finishLoading);
            },
            memberAttached: function (user) {
                this.members.push(user);
            },
            updateMember: function (user, props) {
                this.startLoading();
                var self = this;
                labelTreeApi.updateUser({id: labelTree.id, user_id: user.id}, {
                        role_id: props.role_id,
                    })
                    .then(function () {
                        self.memberUpdated(user, props);
                    }, messages.handleResponseError)
                    .finally(this.finishLoading);
            },
            memberUpdated: function (user, props) {
                user.role_id = props.role_id;
            },
            removeMember: function (user) {
                this.startLoading();
                var self = this;
                labelTreeApi.removeUser({id: labelTree.id, user_id: user.id})
                    .then(function () {
                        self.memberRemoved(user);
                    }, messages.handleResponseError)
                    .finally(this.finishLoading);
            },
            memberRemoved: function (user) {
                for (var i = this.members.length - 1; i >= 0; i--) {
                    if (this.members[i].id === user.id) {
                        this.members.splice(i, 1);
                    }
                }
            },
        }
    });
});
