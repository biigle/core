/**
 * A component managing members of an entity (project, label tree, ...)
 *
 * @type {Object}
 */
biigle.$component('core.components.membersPanel', {
    template: '<div class="panel panel-default" :class="classObject">' +
        '<div class="panel-heading">' +
            'Members' +
            '<span class="pull-right">' +
                '<loader :active="loading"></loader> ' +
                '<button class="btn btn-default btn-xs" title="Edit members" @click="toggleEditing" :class="{active: editing}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>' +
            '</span>' +
        '</div>' +
        '<div class="panel-body" v-if="editing">' +
            '<form class="form-inline" @submit.prevent="attachMember">' +
                '<div class="form-group">' +
                    '<typeahead :items="availableUsers" placeholder="User name" @select="selectMember" :value="selectedMemberName"></typeahead> ' +
                    '<select class="form-control" title="Role of the new user" v-model="selectedRole">' +
                        '<option v-for="role in roles" :value="role.id" v-text="role.name"></option>' +
                    '</select> ' +
                    '<button class="btn btn-default" type="submit" :disabled="!canAttachMember">Add</button>' +
                '</div>' +
            '</form>' +
        '</div>' +
        '<ul class="list-group list-group-restricted">' +
            '<member-list-item v-for="member in members" :key="member.id" :member="member" :own-id="ownId" :editing="editing" :roles="roles" @update="updateMember" @remove="removeMember"></member-list-item>' +
            '<li class="list-group-item list-group-item-info" v-if="!hasMembers">' +
                '<slot></slot>' +
            '</li>' +
        '</ul>' +
    '</div>',
    mixins: [
        biigle.$require('core.mixins.editor'),
    ],
    components: {
        typeahead: biigle.$require('core.components.typeahead'),
        memberListItem: biigle.$require('core.components.memberListItem'),
        loader: biigle.$require('core.components.loader'),
    },
    data: function () {
        return {
            selectedMember: null,
            selectedRole: null,
            users: [],
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
        usersApi: function () {
            return biigle.$require('api.users');
        },
        messages: function () {
            return biigle.$require('messages.store');
        },
        classObject: function () {
            return {
                'panel-warning': this.editing
            };
        },
        availableUsers: function () {
            return this.users.filter(this.isntMember);
        },
        canAttachMember: function () {
            return !this.loading && this.selectedMember && this.selectedRole;
        },
        hasMembers: function () {
            return this.members.length > 0;
        },
        selectedMemberName: function () {
            return this.selectedMember ? this.selectedMember.name : '';
        },
        memberIds: function () {
            return this.members.map(function (user) {
                return user.id;
            });
        }
    },
    methods: {
        selectMember: function (user) {
            this.selectedMember = user;
        },
        attachMember: function () {
            var member = {
                id: this.selectedMember.id,
                role_id: this.selectedRole,
                firstname: this.selectedMember.firstname,
                lastname: this.selectedMember.lastname,
            };
            this.$emit('attach', member);
            this.selectedMember = null;
        },
        updateMember: function (user, props) {
            this.$emit('update', user, props);
        },
        removeMember: function (user) {
            this.$emit('remove', user);
        },
        loadUsers: function () {
            this.usersApi.query().then(this.usersLoaded, this.messages.handleResponseError);
        },
        usersLoaded: function (response) {
            response.data.forEach(function (user) {
                // Assemble full username that can be used for searching in the
                // typeahead.
                user.name = user.firstname + ' ' + user.lastname;
            });
            Vue.set(this, 'users', response.data);
        },
        isntMember: function (user) {
            return this.memberIds.indexOf(user.id) === -1;
        }
    },
    created: function () {
        if (this.defaultRole) {
            this.selectedRole = this.defaultRole;
        } else {
            this.selectedRole = this.roles[0].id;
        }

        this.$once('editing.start', this.loadUsers);
    },
});
