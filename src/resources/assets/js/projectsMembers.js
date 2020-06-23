/**
 * The panel for editing the members of a project
 */
biigle.$viewModel('projects-members', function (element) {
    var messages = biigle.$require('messages.store');
    var project = biigle.$require('projects.project');
    var projectsApi = biigle.$require('api.projects');

    new Vue({
        el: element,
        mixins: [biigle.$require('core.mixins.loader')],
        data: {
            members: biigle.$require('projects.members'),
            roles: biigle.$require('projects.roles'),
            defaultRole: biigle.$require('projects.defaultRoleId'),
            userId: biigle.$require('projects.userId'),
        },
        components: {
            membersPanel: biigle.$require('core.components.membersPanel'),
        },
        computed: {
        },
        methods: {
            attachMember(user) {
                this.startLoading();
                var self = this;
                projectsApi.addUser({id: project.id, user_id: user.id}, {
                        project_role_id: user.role_id,
                    })
                    .then(function () {
                        self.memberAttached(user);
                    }, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
            memberAttached(user) {
                this.members.push(user);
            },
            updateMember(user, props) {
                this.startLoading();
                var self = this;
                projectsApi.updateUser({id: project.id, user_id: user.id}, {
                        project_role_id: props.role_id,
                    })
                    .then(function () {
                        self.memberUpdated(user, props);
                    }, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
            memberUpdated(user, props) {
                user.role_id = props.role_id;
            },
            removeMember(user) {
                this.startLoading();
                var self = this;
                projectsApi.removeUser({id: project.id, user_id: user.id})
                    .then(function () {
                        self.memberRemoved(user);
                    }, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
            memberRemoved(user) {
                for (var i = this.members.length - 1; i >= 0; i--) {
                    if (this.members[i].id === user.id) {
                        this.members.splice(i, 1);
                    }
                }
            },
        }
    });
});
