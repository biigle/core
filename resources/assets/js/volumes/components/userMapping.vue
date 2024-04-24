<template>
<div class="user-mapping">
    <item
        v-for="user in fromUsers"
        :user="user"
        :key="user.id"
        :users="toUsers"
        :loading="loading"
        @select="emitSelect"
        @select-self="emitSelectSelf"
        ></item>
</div>
</template>

<script>
import Item from './userMappingItem';

export default {
    components: {
        Item,
    },
    props: {
        fromUsers: {
            required: true,
            type: Array,
        },
        toUsers: {
            default: () => [],
            type: Array,
        },
        loading: {
            default: false,
            type: Boolean,
        },
    },
    methods: {
        emitSelect(user, id) {
            this.$emit('select', user, id);
        },
        emitSelectSelf(user) {
            this.$emit('select-self', user);
        },
    },
};
</script>
