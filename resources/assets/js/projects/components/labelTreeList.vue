<template>
    <ul class="list-group" @mouseleave="handleLeave">
        <list-item
            v-for="tree in labelTrees"
            :key="tree.id"
            :tree="tree"
            :editable="editable"
            :base-uri="baseUri"
            :editing="editingTreeId === tree.id"
            @remove="emitRemove"
            @enter="handleEnter"
            >
        </list-item>
    </ul>
</template>

<script>
import LabelTreeListItem from './labelTreeListItem.vue';

export default {
    props: {
        labelTrees: {
            type: Array,
            required: true,
        },
        baseUri: {
            type: String,
            required: true,
        },
        editable: {
            type: Boolean,
            required: true,
        },
    },
    components: {
        listItem: LabelTreeListItem,
    },
    data() {
        return {
            editingTreeId: null,
        };
    },
    methods: {
        emitRemove(tree) {
            this.$emit('remove', tree);
        },
        handleEnter(tree) {
            if (this.editable) {
                this.editingTreeId = tree.id;
            }
        },
        handleLeave(e) {
            if (e.relatedTarget !== null) {
                this.editingTreeId = null;
            }
        },
    },
};
</script>
