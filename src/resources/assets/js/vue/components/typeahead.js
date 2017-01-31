/**
 * A component that displays a typeahead to find items.
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.typeahead', {
    template: '<typeahead class="typeahead clearfix" :data="items" :placeholder="placeholder" :on-hit="selectItem" :template="template" :disabled="disabled" :value="value" match-property="name" @clear="clear"></typeahead>',
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
    },
    methods: {
        selectItem: function (item, typeahead) {
            if (!item) return;
            this.$emit('select', item);
            typeahead.reset();
            this.$nextTick(function () {
                typeahead.val = typeahead.value;
            });
        },
        clear: function () {
            this.$emit('select', undefined);
        }
    }
});
