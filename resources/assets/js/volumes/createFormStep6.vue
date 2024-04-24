<script>
import UserApi from '../core/api/users';
import UserMapping from './components/userMapping';
import LoaderMixin from '../core/mixins/loader';

export default {
    mixins: [LoaderMixin],
    components: {
        UserMapping,
    },
    data() {
        return {
            users: [],
            allUsers: [],
            ownUserId: null,
        };
    },
    computed: {
        cannotContinue() {
            return this.loading || this.hasDanglingUsers;
        },
        hasDanglingUsers() {
            return this.danglingUsers.length > 0;
        },
        danglingUsers() {
            return this.users.filter(l => l.mappedUser === null);
        },
        mappedUsers() {
            return this.users.filter(l => l.mappedUser);
        },
    },
    methods: {
        handleSelect(user, id) {
            user.mappedUser = id;
        },
        handleSelectSelf(user) {
            user.mappedUser = this.ownUserId;
        },
        initAllUsers(response) {
            this.allUsers = response.body.map(u => {
                return {
                    id: u.id,
                    name: `${u.firstname} ${u.lastname}`,
                    affiliation: u.affiliation,
                };
            });
        },
    },
    created() {
        this.startLoading()
        UserApi.query().then(this.initAllUsers).finally(this.finishLoading);

        const userMap = biigle.$require('volumes.userMap');

        const users = biigle.$require('volumes.users');
        this.users = Object.keys(users).map(k => {
            return {
                id: k,
                name: users[k],
                mappedUser: userMap[k],
            };
        });

        this.ownUserId = biigle.$require('volumes.ownUserId')
    },
};
</script>
