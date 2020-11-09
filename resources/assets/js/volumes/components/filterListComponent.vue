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
    },
    data() {
        return {
            name: this.rule.id,
        };
    },
    computed: {
        dataName() {
            if (this.rule.data) {
                return this.rule.data.name;
            }

            return '';
        },
    },
};
</script>
