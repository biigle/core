/**
 * A component that displays a typeahead to find labels.
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.labelTypeahead', {
    template: '<typeahead class="label-typeahead" :data="labels" placeholder="Label name" :on-hit="selectLabel" :template="template" match-property="name"></typeahead>',
    data: function () {
        return {
            template: '{{item.name}}'
        };
    },
    components: {
        typeahead: VueStrap.typeahead,
    },
    props: {
        labels: {
            type: Array,
            required: true,
        }
    },
    methods: {
        selectLabel: function (label, typeahead) {
            this.$emit('select', label);
            typeahead.reset();
        }
    }
});
