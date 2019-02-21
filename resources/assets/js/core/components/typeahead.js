/**
 * A component that displays a typeahead to find items.
 *
 * @type {Object}
 */
biigle.$component('core.components.typeahead', {
    template:
    '<typeahead' +
        ' class="typeahead clearfix"' +
        ' match-property="name"' +
        ' ref="typeahead"' +
        ' :data="items"' +
        ' :disabled="disabled"' +
        ' :on-hit="selectItem"' +
        ' :placeholder="placeholder"' +
        ' :template="template"' +
        ' @clear="clear"' +
        '></typeahead>',
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
        selectItem: function (item, typeahead) {
            if (!item) return;
            this.$emit('select', item);

            return this.clearOnSelect ? null : item.name;
        },
        clear: function () {
            this.$emit('select', undefined);
        },
        updateValue: function () {
            this.$refs.typeahead.setValue(this.value);
        },
        emitFocus: function (e) {
            this.$emit('focus', e);
        },
        emitBlur: function (e) {
            this.$emit('blur', e);
        },
    },
    watch: {
        value: function () {
            this.updateValue();
        }
    },
    mounted: function () {
        this.updateValue();
        // Monkey patch additional events to the input.
        this.$refs.typeahead.$el.firstChild.addEventListener('focus', this.emitFocus);
        this.$refs.typeahead.$el.firstChild.addEventListener('blur', this.emitBlur);
    },
});
