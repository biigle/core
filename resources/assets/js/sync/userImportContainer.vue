<script>
import ImportApi from './api/import.js';
import ImportContainer from './mixins/importContainer.vue';
import {handleErrorResponse} from '@/core/messages/store.js';

/**
 * View model for the user import container
 */
export default {
    mixins: [ImportContainer],
    data() {
        return {
            importToken: null,
            importCandidates: [],
            chosenCandidates: [],
        };
    },
    computed: {
        users() {
            return this.importCandidates.map(function (user) {
                user.name = user.firstname + ' ' + user.lastname;
                if (user.email) {
                    user.description = user.email;
                }

                return user;
            });
        },
        hasNoChosenUsers() {
            return this.chosenCandidates.length === 0;
        },
        chosenCandidateIds() {
            return this.chosenCandidates.map((user) => user.id);
        },
    },
    methods: {
        handleChosenUsers(users) {
            this.chosenCandidates = users;
        },
        performImport() {
            this.startLoading();
            let payload = {};
            if (this.chosenCandidates.length < this.importCandidates.length) {
                payload.only = this.chosenCandidateIds;
            }
            ImportApi.update({token: this.importToken}, payload)
                .then(this.importSuccess, handleErrorResponse)
                .finally(this.finishLoading);
        },
    },
    created() {
        this.importToken = biigle.$require('sync.importToken');
        this.importCandidates = biigle.$require('sync.importCandidates');
    },
};
</script>
