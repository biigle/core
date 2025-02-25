<template>
<span class="tag label label-default">
    <span v-text="name"></span>
    <button type="button" class="close" :title="title" @click="remove">
        <span aria-hidden="true">&times;</span>
    </button>
</span>
</template>

<script>
export default {
    emits: ['remove'],
    props: ['user'],
    computed: {
        name() {
            return this.user.firstname + ' ' + this.user.lastname;
        },
        title() {
            return 'Remove ' + this.name;
        },
    },
    methods: {
        remove() {
            this.$emit('remove', this.user);
        },
    },
};
</script>

<style scoped>
.close {
    vertical-align: text-bottom;
}
</style>
