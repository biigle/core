<template>
    <form @submit.prevent="attachMember">
        <div class="form-group clearfix">
            <a class="pull-right" href="/manual/tutorials/projects/about#members" title="Learn more about project members" target="_blank"><i class="fa fa-question-circle"></i></a>
            <label>User name</label>
            <typeahead
                more-info="affiliation"
                placeholder=""
                :disabled="disabled"
                :items="availableUsers"
                :value="selectedMemberName"
                @select="selectMember"
                @focus="loadUsers"
                class="typeahead--block"
                ></typeahead>
        </div>
        <div class="form-group">
            <label>New member role</label>
            <select
                class="form-control"
                v-model="selectedRole"
                :disabled="disabled"
                >
                <option
                    v-for="role in roles"
                    :value="role.id"
                    v-text="role.name"
                    ></option>
            </select>
        </div>
        <button
            class="btn btn-success btn-block"
            type="submit"
            :disabled="!canAttachMember"
            >
            Add
        </button>
    </form>
</template>

<script>
import LoaderMixin from '@/core/mixins/loader.vue';
import Typeahead from '@/core/components/typeahead.vue';
import UsersApi from '@/core/api/users.js';
import {handleErrorResponse} from '@/core/messages/store.vue';

export default {
    mixins: [LoaderMixin],
    props: {
        members: {
            type: Array,
            required: true,
        },
        roles: {
            type: Array,
            required: true,
        },
        defaultRole: {
            type: Object,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    components: {
        typeahead: Typeahead,
    },
    data() {
        return {
            selectedMember: null,
            selectedRole: null,
            usersLoaded: false,
            users: [],
        };
    },
    computed: {
        memberIds() {
            return this.members.map(user => user.id);
        },
        availableUsers() {
            return this.users.filter(user => !this.memberIds.includes(user.id));
        },
        canAttachMember() {
            return !this.disabled && this.selectedMember && this.selectedRole;
        },
        selectedMemberName() {
            return this.selectedMember ? this.selectedMember.name : '';
        },
    },
    methods: {
        selectMember(user) {
            this.selectedMember = user;
        },
        attachMember() {
            let member = {
                id: this.selectedMember.id,
                role_id: this.selectedRole,
                firstname: this.selectedMember.firstname,
                lastname: this.selectedMember.lastname,
                affiliation: this.selectedMember.affiliation,
            };
            this.$emit('attach', member);
            this.selectedMember = null;
        },
        loadUsers() {
            if (!this.usersLoaded) {
                this.usersLoaded = true;
                this.startLoading();
                UsersApi.query()
                    .then(this.loadedUsers, handleErrorResponse)
                    .finally(this.finishLoading);
            }
        },
        loadedUsers(response) {
            this.users = response.data.map(function (user) {
                // Assemble full username that can be used for searching in the
                // typeahead.
                user.name = user.firstname + ' ' + user.lastname;

                return user;
            });
        },
    },
    created() {
        if (this.defaultRole) {
            this.selectedRole = this.defaultRole.id;
        } else {
            this.selectedRole = this.roles[0].id;
        }
    },
};
</script>
