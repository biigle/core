<template>
    <typeahead
        class="typeahead clearfix"
        match-property="name"
        ref="typeahead"
        :data="items"
        :disabled="disabled"
        :on-hit="selectItem"
        :placeholder="placeholder"
        :template="template"
        @clear="clear"
        ></typeahead>
</template>

<script>
/**
 * A component that displays a typeahead to find items.
 *
 * @type {Object}
 */
export default {
    components: {
        typeahead: VueStrap.typeahead,
    },
    props: {
        items: {
            type: Array,
            required: true,
        },
        placeholder: {
            type: String,
            default: 'Item name',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        value: {
            type: String,
            default: '',
        },
        clearOnSelect: {
            type: Boolean,
            default: false,
        },
        template: {
            default: '{{item.name}}',
        },
    },
    methods: {
        selectItem(item) {
            if (!item) return;
            this.$emit('select', item);

            return this.clearOnSelect ? null : item.name;
        },
        clear() {
            this.$emit('select', undefined);
        },
        updateValue() {
            this.$refs.typeahead.setValue(this.value);
        },
        emitFocus(e) {
            this.$emit('focus', e);
        },
        emitBlur(e) {
            this.$emit('blur', e);
        },
    },
    watch: {
        value() {
            this.updateValue();
        },
    },
    mounted() {
        this.updateValue();
        // Monkey patch additional events to the input.
        this.$refs.typeahead.$el.firstChild.addEventListener('focus', this.emitFocus);
        this.$refs.typeahead.$el.firstChild.addEventListener('blur', this.emitBlur);
    },
};
</script>
