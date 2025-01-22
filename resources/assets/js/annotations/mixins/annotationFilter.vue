<template>
    <typeahead
            :items="items"
            :placeholder="placeholder"
            :value="selectedItemName"
            @select="select"
        ></typeahead>
</template>

<script>
import Typeahead from '@/core/components/typeahead.vue';

export default {
    emits: [
        'select',
        'unselect',
    ],
    props: {
        annotations: {
            type: Array,
            required: true,
        },
    },
    components: {
        typeahead: Typeahead,
    },
    data() {
        return {
            placeholder: '',
            selectedItem: null,
        };
    },
    computed: {
        items() {
            return [];
        },
        selectedItemName() {
            return this.selectedItem ? this.selectedItem.name : '';
        },
    },
    methods: {
        select(item) {
            this.selectedItem = item;
        },
        filter(annotations) {
            return annotations;
        },
        reset() {
            this.selectedItem = null;
        },
    },
    watch: {
        selectedItem(item) {
            if (item) {
                this.$emit('select', this);
            } else {
                this.$emit('unselect');
            }
        },
    },
};
</script>
