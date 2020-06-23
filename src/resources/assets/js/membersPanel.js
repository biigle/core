import {handleErrorResponse} from './import';
import {LabelTreesApi} from './import';
import {LoaderMixin} from './import';
import {MembersPanel} from './import';

/**
 * The panel for editing the members of a label tree
 */
export default {
    mixins: [LoaderMixin],
    data: {
        labelTree: null,
        members: [],
        roles: [],
        defaultRole: null,
        userId: null,
    },
    components: {
        membersPanel: MembersPanel,
    },
    methods: {
        attachMember(user) {
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
    created() {
        this.labelTree = biigle.$require('labelTrees.labelTree');
        this.members = biigle.$require('labelTrees.members');
        this.roles = biigle.$require('labelTrees.roles');
        this.defaultRole = biigle.$require('labelTrees.defaultRoleId');
        this.userId = biigle.$require('labelTrees.userId');
    },
};
