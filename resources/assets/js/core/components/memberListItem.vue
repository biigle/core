<template>
    <li class="list-group-item clearfix">
        <span class="pull-right">
            <span v-if="editing && !isOwnUser">
                <form class="form-inline">
                    <select class="form-control input-sm" :title="'Change the role of ' + name" v-model="roleId" @change="changeRole">
                        <option v-for="role in roles" :key="role.id" :value="role.id" v-text="role.name"></option>
                    </select>
                    <button type="button" class="btn btn-default btn-sm" :title="'Remove ' + name" @click="removeMember">Remove</button>
                </form>
            </span>
            <span v-else>
                <span class="text-muted" v-text="role.name"></span>
            </span>
        </span>
        <span v-text="name"></span> <span class="text-muted" v-if="isOwnUser">(you)</span>
    </li>
</template>

<script>
/**
 * A component a list item of the membersPanel
 *
 * @type {Object}
 */
export default {
    props: {
        member: {
            type: Object,
            required: true,
        },
        ownId: {
            type: Number,
            required: true,
        },
        editing: {
            type: Boolean,
            required: true,
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
        name() {
            return this.member.firstname + ' ' + this.member.lastname;
        },
        role() {
            return this.roles.find((role) => {
                return this.member.role_id === role.id;
            });
        }
    },
    methods: {
        removeMember() {
            this.$emit('remove', this.member);
        },
        changeRole() {
            this.$emit('update', this.member, {role_id: this.roleId});
        }
    },
    created() {
        this.roleId = this.member.role_id;
    },
};
</script>
