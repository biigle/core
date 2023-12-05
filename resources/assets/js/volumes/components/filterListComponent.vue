<template>
    <span>
        <strong>with<span v-if="rule.negate">out</span></strong>
        <span v-text="name"></span>
        <strong v-if="dataName" v-text="dataName"></strong>
    </span>
</template>

<script>
/**
 * Base component for a filter list item
 *
 * @type {Object}
 */
export default {
    props: {
        rule: {
            type: Object,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            name: this.rule.id,
        };
    },
    methods: {
        createFileCount(rule) {
            let typeForm = rule.sequence.length === 1 ? `${this.type}` : `${this.type}s`;
            return `(${rule.sequence.length} ${typeForm})`;
        },
    },
    computed: {
        dataName() {
            if (this.rule.data) {
                let fileCount = this.createFileCount(this.rule);
                if(this.rule.data.name) {
                    return `${this.rule.data.name} ${fileCount}`;
                } else {
                    return fileCount;
                }
            }

            return '';
        },
    },
};
</script>
