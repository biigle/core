<template>
    <span>
        <strong>with<span v-if="rule.negate">out</span></strong>
        <span v-text="name"></span>
        <strong v-if="dataSpecs" v-text="dataSpecs"></strong>
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
    computed: {
        createFileCount() {
            let typeForm = this.rule.sequence.length === 1 ? `${this.type}` : `${this.type}s`;
            return `(${this.rule.sequence.length} ${typeForm})`;
        },
        dataSpecs() {
            let fileCount = this.createFileCount;
            // if present, combine rule-name and filecount
            if (this.rule.data) {
                if(this.rule.data.name) {
                    return `${this.rule.data.name} ${fileCount}`;
                }
            }

            return fileCount;
        },
    },
};
</script>
