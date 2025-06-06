<script>
import AddMemberForm from '@/projects/components/addMemberForm.vue';
import Events from '@/core/events.js';
import LabelTreesApi from '@/core/api/labelTree.js';
import LoaderMixin from '@/core/mixins/loader.vue';
import MemberList from '@/projects/components/memberList.vue';
import {Popover} from 'uiv';
import {handleErrorResponse} from '@/core/messages/store.js';

/**
 * The panel for editing the members of a label tree
 */
export default {
    mixins: [LoaderMixin],
    data() {
        return {
            labelTree: null,
            members: [],
            roles: [],
            defaultRole: null,
            userId: null,
            memberPopoverOpen: false,
        };
    },
    components: {
        memberList: MemberList,
        addMemberForm: AddMemberForm,
        popover: Popover,
    },
    computed: {
        hasMembers() {
            return this.membersCount !== 0;
        },
        membersCount() {
            return this.members.length;
        },
    },
    methods: {
        attachMember(user) {
            this.memberPopoverOpen = false;
            this.startLoading();
            LabelTreesApi.addUser({id: this.labelTree.id}, {
                    id: user.id,
                    role_id: user.role_id,
                })
                .then(() => this.memberAttached(user), handleErrorResponse)
                .finally(this.finishLoading);
        },
        memberAttached(user) {
            this.members.push(user);
        },
        updateMember(user, props) {
            this.startLoading();
            LabelTreesApi.updateUser({id: this.labelTree.id, user_id: user.id}, {
                    role_id: props.role_id,
                })
                .then(() => this.memberUpdated(user, props), handleErrorResponse)
                .finally(this.finishLoading);
        },
        memberUpdated(user, props) {
            user.role_id = props.role_id;
        },
        removeMember(user) {
            this.startLoading();
            LabelTreesApi.removeUser({id: this.labelTree.id, user_id: user.id})
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
    watch: {
        membersCount(count) {
            Events.emit('label-trees.members.count', count);
        },
    },
    created() {
        this.labelTree = biigle.$require('labelTrees.labelTree');
        this.members = biigle.$require('labelTrees.members');
        this.roles = biigle.$require('labelTrees.roles');
        this.defaultRole = biigle.$require('labelTrees.defaultRole');
        this.userId = biigle.$require('labelTrees.userId');
    },
};
</script>
