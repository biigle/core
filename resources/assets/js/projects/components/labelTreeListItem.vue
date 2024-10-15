<template>
    <li class="list-group-item limit-text" @mouseenter="emitEnter">
        <h4 class="list-group-item-heading">
            <button v-if="editable" v-show="editing" type="button" class="btn btn-default btn-sm pull-right" title="Detach this label tree" @click="emitRemove"><i class="fa fa-trash"></i></button>
            <a :href="url" v-text="tree.name"></a>
        </h4>
        <p v-if="tree.description" class="list-group-item-text" v-text="tree.description"></p>
    </li>
</template>

<style>
.limit-text {
    word-wrap: break-word;
}
</style>

<script>
export default {
    props: {
        tree: {
            type: Object,
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
        editing: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        url() {
            return this.baseUri + '/' + this.tree.id;
        },
    },
    methods: {
        emitRemove() {
            this.$emit('remove', this.tree);
        },
        emitEnter() {
            this.$emit('enter', this.tree);
        },
    },
};
</script>
