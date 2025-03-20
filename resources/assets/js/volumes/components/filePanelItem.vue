<template>
<li class="list-group-item" :class="classObject">
    <button type="button" class="close" :title="title" @click="remove" v-once>
        <span aria-hidden="true">&times;</span>
    </button>
    <span class="text-muted">#<span v-text="file.id"></span></span>
    <span v-text="file.filename"></span>
</li>
</template>
<script>
export default {
    emits: ['remove'],
    props: ['file', 'type'],
    computed: {
        classObject() {
            return {
                'list-group-item-success': this.file.isNew,
            };
        },
        title() {
            return `Delete ${this.type} #${this.file.id}`;
        },
    },
    methods: {
        remove() {
            this.$emit('remove', this.file);
        },
    },
};
</script>
