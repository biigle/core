<template>
    <li class="list-group-item clearfix" @mouseenter="emitEnter">
        <h4 class="list-group-item-heading">
            <span v-if="editable" v-show="isEditing" class="pull-right">
                <form class="form-inline">
                    <select :disabled="isOwnUser" class="form-control input-sm" :title="`Change the role of ${name}`" v-model="roleId" @change="changeRole">
                        <option v-for="role in roles" :value="role.id" v-text="role.name"></option>
                    </select>
                    <button :disabled="isOwnUser" type="button" class="btn btn-default btn-sm" :title="`Remove ${name}`" @click="removeMember"><i class="fa fa-trash"></i></button>
                </form>
            </span>
            <span v-show="!isEditing" class="pull-right label" :class="labelClass" v-text="role.name"></span>
            <span v-text="name"></span> <span v-if="isOwnUser" class="text-muted">(you)</span>
        </h4>
        <p v-if="member.affiliation" class="list-group-item-text text-muted" v-text="member.affiliation"></p>
    </li>
</template>

<script>
/**
 * A component a list item of the membersPanel
 *
 * @type {Object}
 */
export default {
    emits: [
        'enter',
        'remove',
        'update',
    ],
    props: {
        member: {
            type: Object,
            required: true,
        },
        ownId: {
            type: Number,
            required: true,
        },
        editable: {
            type: Boolean,
            required: true,
        },
        editing: {
            type: Boolean,
            default: false,
        },
        roles: {
            type: Array,
            required: true,
        },
    },
    data() {
        return {
            roleId: null,
        };
    },
    computed: {
        isOwnUser() {
            return this.member.id === this.ownId;
        },
        isEditing() {
            return this.editing && !this.isOwnUser;
        },
        name() {
            return this.member.firstname + ' ' + this.member.lastname;
        },
        role() {
            return this.roles.find((role) => {
                return this.member.role_id === role.id;
            });
        },
        labelClass() {
            switch (this.role.name) {
                case 'admin':
                    return 'label-danger';
                case 'expert':
                    return 'label-warning';
                case 'editor':
                    return 'label-primary';
                default:
                    return 'label-default';
            }
        },
    },
    methods: {
        removeMember() {
            this.$emit('remove', this.member);
        },
        changeRole() {
            this.$emit('update', this.member, {role_id: this.roleId});
        },
        emitEnter() {
            this.$emit('enter', this.member);
        },
    },
    created() {
        this.roleId = this.member.role_id;
    },
};
</script>
