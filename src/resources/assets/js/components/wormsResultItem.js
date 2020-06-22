/**
 * An item of the results list of a WoRMS search
 *
 * @type {Object}
 */
export default {
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
        },
    },
    computed: {
        classification() {
            return this.item.parents.join(' > ');
        },
        buttonTitle() {
            if (this.recursive) {
                return `Add ${this.item.name} and all WoRMS parents as new labels`;
            }

            if (this.parent) {
                return `Add ${this.item.name} as a child of ${this.parent.name}`;
            }

            return `Add ${this.item.name} as a root label`;
        },
        classObject() {
            return {
                'list-group-item-success': this.selected,
            };
        },
        selected() {
            return this.labels.some((label) => label.source_id == this.item.aphia_id);
        },
    },
    methods: {
        select() {
            if (!this.selected) {
                this.$emit('select', this.item);
            }
        },
    },
};
