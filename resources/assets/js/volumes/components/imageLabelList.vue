<template>
    <ul class="image-label-list">
        <list-item
            v-for="item in imageLabels"
            :key="item.id"
            :item="item"
            :deletable="canDelete(item)"
            @deleted="emitDeleted"
            ></list-item>
        <li v-if="!hasImageLabels" class="text-muted">No image labels</li>
    </ul>
</template>

<script>
import Item from './imageLabelListItem';

/**
 * List of image labels.
 *
 * @type {Object}
 */
export default {
    components: {
        listItem: Item,
    },
    props: {
        imageLabels: {
            type: Array,
            required: true,
        },
        userId: {
            type: Number,
            required: true,
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        hasImageLabels() {
            return this.imageLabels.length > 0;
        },
    },
    methods: {
        canDelete(item) {
            return this.isAdmin === true || this.userId === item.user.id;
        },
        emitDeleted(item) {
            this.$emit('deleted', item);
        },
    },
};
</script>
