/**
 * A component that displays a typeahead to find items.
 *
 * @type {Object}
 */
biigle.$component('core.components.typeahead', {
    template: '<typeahead ref="typeahead" class="typeahead clearfix" :data="items" :placeholder="placeholder" :on-hit="selectItem" :template="template" :disabled="disabled" match-property="name" @clear="clear"></typeahead>',
    data: function () {
        return {
            template: '{{item.name}}',
        };
    },
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
            defeult: false,
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
        }
    },
    watch: {
        value: function (value) {
            this.$refs.typeahead.setValue(value);
        },
    },
});
