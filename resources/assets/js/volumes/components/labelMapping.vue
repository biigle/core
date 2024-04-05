<template>
<table class="label-mapping">
    <item
        v-for="label in fromLabels"
        :label="label"
        :key="label.id"
        :labels="toLabels"
        ></item>
</table>
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
            default: () => {},
            type: Object,
        },
    },
};
</script>
