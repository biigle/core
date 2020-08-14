<template>
    <ul class="list-group" @mouseleave="handleLeave">
        <member-list-item
            v-for="member in members"
            :key="member.id"
            :member="member"
            :own-id="ownId"
            :editable="editable"
            :editing="editingMemberId === member.id"
            :roles="roles"
            @remove="emitRemove"
            @update="emitUpdate"
            @enter="handleEnter"
            >
        </member-list-item>
    </ul>
</template>

<script>
import MemberListItem from './memberListItem';

export default {
    props: {
        members: {
            type: Array,
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
        roles: {
            type: Array,
            required: true,
        },
    },
    components: {
        memberListItem: MemberListItem,
    },
    data() {
        return {
            editingMemberId: null,
        };
    },
    methods: {
        emitRemove(member) {
            this.$emit('remove', member);
        },
        emitUpdate(member, data) {
            this.$emit('update', member, data);
        },
        handleEnter(member) {
            if (this.editable) {
                this.editingMemberId = member.id;
            }
        },
        handleLeave(e) {
            if (e.relatedTarget !== null) {
                this.editingMemberId = null;
            }
        },
    },
};
</script>
