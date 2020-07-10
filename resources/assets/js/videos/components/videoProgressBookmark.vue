<template>
    <span class="bookmark" :style="style" @click.stop="emitSelect"></span>
</template>

<script>
export default {
    props: {
        bookmark: {
            type: Object,
            required: true,
        },
    },
    computed: {
        style() {
            let offset = this.bookmark.time / this.$parent.duration * this.$parent.elementWidth;

            return `left: ${offset}px`;
        },
    },
    methods: {
        emitSelect() {
            this.$emit('select', this.bookmark);
        },
    },
};
</script>
