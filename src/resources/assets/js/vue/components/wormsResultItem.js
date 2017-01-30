/**
 * An item of the results list of a WoRMS search
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.wormsResultItem', {
    props: {
        item: {
            type: Object,
            required: true,
        },
        recursive: {
            type: Boolean,
            required: true,
        },
        labels: {
            type: Array,
            required: true,
        },
        parent: {
            type: Object,
            default: null,
        }
    },
    computed: {
        classification: function () {
            return this.item.parents.join(' > ');
        },
        buttonTitle: function () {
            if (this.recursive) {
                return 'Add ' + this.item.name + ' and all WoRMS parents as new labels';
            }

            if (this.parent) {
                return 'Add ' + this.item.name + ' as a child of ' + this.parent.name;
            }

            return 'Add ' + this.item.name + ' as a root label';
        },
        classObject: function () {
            return {
                'list-group-item-success': this.selected
            };
        },
        selected: function () {
            var self = this;
            return !!this.labels.find(function (label) {
                return label.source_id == self.item.aphia_id;
            });
        }
    },
    methods: {
        select: function () {
            if (!this.selected) {
                this.$emit('select', this.item);
            }
        },
    },
});
