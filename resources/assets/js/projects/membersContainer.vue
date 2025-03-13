<script>
import AddMemberForm from './components/addMemberForm.vue';
import CreateInvitationForm from './components/createInvitationForm.vue';
import Events from '@/core/events.js';
import InvitationApi from './api/projectInvitations.js';
import InvitationListItem from './components/invitationListItem.vue';
import LoaderMixin from '@/core/mixins/loader.vue';
import MemberList from './components/memberList.vue';
import {Modal, Popover} from 'uiv';
import ProjectsApi from '@/core/api/projects.js';
import {handleErrorResponse} from '@/core/messages/store.js';

export default {
    mixins: [LoaderMixin],
    data() {
        return {
            project: null,
            canEdit: false,
            members: [],
            roles: {},
            defaultRole: null,
            userId: null,
            invitations: [],
            invitationPopoverOpen: false,
            memberPopoverOpen: false,
            invitationModalOpen: false,
            shownInvitation: null,
            invitationUrl: '',
        };
    },
    components: {
        memberList: MemberList,
        addMemberForm: AddMemberForm,
        popover: Popover,
        createInvitationForm: CreateInvitationForm,
        invitationListItem: InvitationListItem,
        modal: Modal,
    },
    computed: {
        rolesWithoutAdmin() {
            return this.roles.filter(r => r.name !== 'admin');
        },
        sortedInvitations() {
            let sorted = this.invitations.slice();
            sorted.sort((a, b) => a.id < b.id);

            return sorted;
        },
        shownInvitationLink() {
            let uuid = this.shownInvitation ? this.shownInvitation.uuid : '';

            return `${this.invitationUrl}/${uuid}`;
        },
        shownInvitationQrLink() {
            let id = this.shownInvitation ? this.shownInvitation.id : '';

            return this.invitationQrUrl.replace('{id}', id);
        },
        membersCount() {
            return this.members.length;
        },
    },
    methods: {
        attachMember(user) {
            this.memberPopoverOpen = false;
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
        handleCreatedInvitation(invitation) {
            this.invitations.push(invitation);
            this.invitationPopoverOpen = false;
        },
        handleDeleteInvitation(id) {
            this.startLoading();
            InvitationApi.delete({id: id})
                .then(() => {
                    this.invitations = this.invitations.filter(i => i.id !== id)
                }, handleErrorResponse)
                .finally(this.finishLoading);
        },
        handleShowInvitation(invitation) {
            this.invitationModalOpen = true;
            this.shownInvitation = invitation;
        },
    },
    watch: {
        membersCount(count) {
            Events.emit('project.members.count', count);
        },
    },
    created() {
        this.project = biigle.$require('projects.project');
        this.canEdit = biigle.$require('projects.canEdit');
        this.roles = biigle.$require('projects.roles');
        this.defaultRole = biigle.$require('projects.defaultRole');
        this.members = biigle.$require('projects.members');
        this.userId = biigle.$require('projects.userId');
        this.invitations = biigle.$require('projects.invitations');
        this.invitationUrl = biigle.$require('projects.invitationUrl');
        this.invitationQrUrl = biigle.$require('projects.invitationQrUrl');
    },
};
</script>
