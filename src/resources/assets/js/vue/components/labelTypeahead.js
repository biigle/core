/**
 * A component that displays a typeahead to find labels.
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.labelTypeahead', {
    template: '<typeahead class="label-typeahead clearfix" :data="labels" :placeholder="placeholder" :on-hit="selectLabel" :template="template" :disabled="disabled" :value="value" match-property="name"></typeahead>',
    data: function () {
        return {
            template: '{{item.name}}',
        };
    },
    components: {
        typeahead: VueStrap.typeahead,
    },
    props: {
        labels: {
            type: Array,
            required: true,
        },
        placeholder: {
            type: String,
            default: 'Label name',
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
        selectLabel: function (label, typeahead) {
            this.$emit('select', label);
            typeahead.reset();
        }
    }
});
