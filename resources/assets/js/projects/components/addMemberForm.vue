<template>
    <form class="form-inline" @submit.prevent="attachMember">
        <loader :active="loading"></loader>
        <typeahead :disabled="disabled" :items="availableUsers" placeholder="User name" @select="selectMember" @focus="loadUsers" :value="selectedMemberName" more-info="affiliation"></typeahead>
        <select :disabled="disabled" class="form-control" title="Role of the new user" v-model="selectedRole">
            <option v-for="role in roles" :value="role.id" v-text="role.name"></option>
        </select>
        <button class="btn btn-default" type="submit" :disabled="!canAttachMember">Add member</button>
    </form>
</template>

<script>
import LoaderMixin from '../../core/mixins/loader';
import Typeahead from '../../core/components/typeahead';
import UsersApi from '../../core/api/users';
import {handleErrorResponse} from '../../core/messages/store';

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
