/**
 * A mixin for components that create new labels
 *
 * @type {Object}
 */
biigle.$component('labelTrees.mixins.labelFormComponent', {
    props: {
        labels: {
            type: Array,
            required: true,
        },
        color: {
            type: String,
            default: '',
        },
        parent: {
            type: Object,
            default: null,
        },
        name: {
            type: String,
            default: '',
        },
    },
    components: {
        typeahead: biigle.$require('core.components.typeahead'),
    },
    computed: {
        selectedColor: {
            get: function () {
                return this.color;
            },
            set: function (color) {
                this.$emit('color', color);
            }
        },
        selectedName: {
            get: function () {
                return this.name;
            },
            set: function (name) {
                this.$emit('name', name);
            }
        },
        selectedParent: function () {
            return this.parent ? this.parent.name : '';
        },
        hasNoLabels: function () {
            return this.labels.length === 0;
        },
        hasNoParent: function () {
            return !this.parent;
        },
        hasNoName: function () {
            return !this.name;
        }
    },
    methods: {
        refreshColor: function () {
            this.selectedColor = biigle.$require('labelTrees.randomColor')();
        },
        resetParent: function () {
            this.$emit('parent', null);
        },
        selectLabel: function (label) {
            this.$emit('parent', label);
        },
    },
});
