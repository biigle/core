<template>
    <div class="panel panel-default" :class="classObject">
        <div class="panel-heading">
            Members
            <span class="pull-right">
                <loader :active="loading"></loader>
                <button class="btn btn-default btn-xs" title="Edit members" @click="toggleEditing" :class="{active: editing}"><span class="fa fa-pencil-alt" aria-hidden="true"></span></button>
            </span>
        </div>
        <div class="panel-body" v-if="editing">
            <form class="form-inline" @submit.prevent="attachMember">
                <div class="form-group">
                    <typeahead :items="availableUsers" placeholder="User name" @select="selectMember" :value="selectedMemberName" :template="typeaheadTemplate"></typeahead>
                    <select class="form-control" title="Role of the new user" v-model="selectedRole">
                        <option v-for="role in roles" :key="role.id" :value="role.id" v-text="role.name"></option>
                    </select>
                    <button class="btn btn-default" type="submit" :disabled="!canAttachMember">Add</button>
                </div>
            </form>
        </div>
        <ul class="list-group list-group-restricted">
            <member-list-item v-for="member in members" :key="member.id" :member="member" :own-id="ownId" :editing="editing" :roles="roles" @update="updateMember" @remove="removeMember"></member-list-item>
            <li class="list-group-item list-group-item-info" v-if="!hasMembers">
                <slot></slot>
            </li>
        </ul>
    </div>
</template>

<script>
import ListItem from './memberListItem';
import Loader from './loader';
import Typeahead from './typeahead';
import EditorMixin from '../mixins/editor';
import UsersApi from '../api/users';
import Messages from '../messages/store';

/**
 * A component managing members of an entity (project, label tree, ...)
 *
 * @type {Object}
 */
export default {
    mixins: [EditorMixin],
    components: {
        typeahead: Typeahead,
        memberListItem: ListItem,
        loader: Loader,
    },
    data() {
        return {
            selectedMember: null,
            selectedRole: null,
            users: [],
            typeaheadTemplate: '<span v-text="item.name"></span><br><small v-text="item.affiliation"></small>',
        };
    },
    props: {
        members: {
            type: Array,
            required: true,
        },
        roles: {
            type: Array,
            required: true,
        },
        ownId: {
            type: Number,
            required: true,
        },
        defaultRole: {
            type: Number,
        },
        loading: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        classObject() {
            return {
                'panel-warning': this.editing
            };
        },
        availableUsers() {
            return this.users.filter(this.isntMember);
        },
        canAttachMember() {
            return !this.loading && this.selectedMember && this.selectedRole;
        },
        hasMembers() {
            return this.members.length > 0;
        },
        selectedMemberName() {
            return this.selectedMember ? this.selectedMember.name : '';
        },
        memberIds() {
            return this.members.map(function (user) {
                return user.id;
            });
        }
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
            };
            this.$emit('attach', member);
            this.selectedMember = null;
        },
        updateMember(user, props) {
            this.$emit('update', user, props);
        },
        removeMember(user) {
            this.$emit('remove', user);
        },
        loadUsers() {
            UsersApi.query().then(this.usersLoaded, Messages.handleResponseError);
        },
        usersLoaded(response) {
            response.data.forEach(function (user) {
                // Assemble full username that can be used for searching in the
                // typeahead.
                user.name = user.firstname + ' ' + user.lastname;
            });
            Vue.set(this, 'users', response.data);
        },
        isntMember(user) {
            return this.memberIds.indexOf(user.id) === -1;
        }
    },
    created() {
        if (this.defaultRole) {
            this.selectedRole = this.defaultRole;
        } else {
            this.selectedRole = this.roles[0].id;
        }

        this.$once('editing.start', this.loadUsers);
    },
};
</script>
