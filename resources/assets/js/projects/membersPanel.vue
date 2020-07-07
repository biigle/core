<script>
import LoaderMixin from '../core/mixins/loader';
import MembersPanel from '../core/components/membersPanel';
import ProjectsApi from '../core/api/projects';
import {handleErrorResponse} from '../core/messages/store';

/**
 * The panel for editing the members of a project
 */
export default {
    mixins: [LoaderMixin],
    data() {
        return {
            project: null,
            members: [],
            roles: [],
            defaultRole: null,
            userId: null,
        };
    },
    components: {
        membersPanel: MembersPanel,
    },
    methods: {
        attachMember(user) {
            this.startLoading();
            ProjectsApi.addUser({id: this.project.id, user_id: user.id}, {
                    project_role_id: user.role_id,
                })
                .then(() => this.memberAttached(user), handleErrorResponse)
                .finally(this.finishLoading);
        },
        memberAttached(user) {
            this.members.push(user);
        },
        updateMember(user, props) {
            this.startLoading();
            ProjectsApi.updateUser({id: this.project.id, user_id: user.id}, {
                    project_role_id: props.role_id,
                })
                .then(() => this.memberUpdated(user, props), handleErrorResponse)
                .finally(this.finishLoading);
        },
        memberUpdated(user, props) {
            user.role_id = props.role_id;
        },
        removeMember(user) {
            this.startLoading();
            ProjectsApi.removeUser({id: this.project.id, user_id: user.id})
                .then(() => this.memberRemoved(user), handleErrorResponse)
                .finally(this.finishLoading);
        },
        memberRemoved(user) {
            for (let i = this.members.length - 1; i >= 0; i--) {
                if (this.members[i].id === user.id) {
                    this.members.splice(i, 1);
                }
            }
        },
    },
    created() {
        this.project = biigle.$require('projects.project');
        this.members = biigle.$require('projects.members');
        this.roles = biigle.$require('projects.roles');
        this.defaultRole = biigle.$require('projects.defaultRoleId');
        this.userId = biigle.$require('projects.userId');
    },
};
</script>
