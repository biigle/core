<template>
<div class="label-mapping">
    <item
        v-for="label in fromLabels"
        :label="label"
        :key="label.id"
        :labels="toLabels"
        :trees="trees"
        :loading="loading"
        @select="emitSelect"
        @create="emitCreate"
        ></item>
</div>
</template>

<script>
import Item from './labelMappingItem';

export default {
    components: {
        item: Item,
    },
    props: {
        fromLabels: {
            required: true,
            type: Array,
        },
        toLabels: {
            default: () => [],
            type: Array,
        },
        trees: {
            default: () => [],
            type: Array,
        },
        loading: {
            default: false,
            type: Boolean,
        },
    },
    methods: {
        emitSelect(label, id) {
            this.$emit('select', label, id);
        },
        emitCreate(label, treeId, newLabel) {
            this.$emit('create', label, treeId, newLabel);
        },
    },
};
</script>
