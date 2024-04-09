<template>
<div class="label-mapping">
    <item
        v-for="label in fromLabels"
        :label="label"
        :key="label.id"
        :labels="toLabels"
        :trees="trees"
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
    },
};
</script>
