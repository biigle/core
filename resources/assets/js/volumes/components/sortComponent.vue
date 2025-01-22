<template>
    <button class="list-group-item" :title="title" @click="handleClick" :class="classObject" v-text="text"></button>
</template>

<script>
/**
 * A component of the sorting tab.
 *
 * @type {Object}
 */
export default {
    emits: ['select'],
    props: {
        activeSorter: {
            type: String,
            default: '',
        },
    },
    computed: {
        active() {
            return this.activeSorter === this.id;
        },
        classObject() {
            return {
                active: this.active,
            };
        },
    },
    methods: {
        getSequence() {
            return new Vue.Promise.resolve([]);
        },
        handleClick() {
            if (!this.active) {
                this.$emit('select', this);
            }
        },
    },
};
</script>
