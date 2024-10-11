<template>
    <ul class="file-label-list">
        <list-item
            v-for="item in fileLabels"
            :key="item.id"
            :item="item"
            :deletable="canDelete(item)"
            :type="type"
            @deleted="emitDeleted"
            ></list-item>
        <li v-if="!hasImageLabels" class="text-muted">No {{type}} labels</li>
    </ul>
</template>

<script>
import Item from './fileLabelListItem.vue';

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
        fileLabels: {
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
        type: {
            type: String,
            default: 'image',
        },
    },
    computed: {
        hasImageLabels() {
            return this.fileLabels.length > 0;
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
