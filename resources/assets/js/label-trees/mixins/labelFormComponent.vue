<script>
import LabelTypeahead from '../components/labelTypeahead.vue';
import {randomColor} from '../utils.js';

/**
 * A mixin for components that create new labels
 *
 * @type {Object}
 */
export default {
    emits: [
        'color',
        'name',
        'parent',
    ],
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
        typeahead: LabelTypeahead,
    },
    computed: {
        selectedColor: {
            get() {
                return this.color;
            },
            set(color) {
                this.$emit('color', color);
            },
        },
        selectedName: {
            get() {
                return this.name;
            },
            set(name) {
                this.$emit('name', name);
            }
        },
        selectedParent() {
            return this.parent ? this.parent.name : '';
        },
        hasNoLabels() {
            return this.labels.length === 0;
        },
        hasNoParent() {
            return !this.parent;
        },
        hasNoName() {
            return !this.name;
        },
    },
    methods: {
        refreshColor() {
            this.selectedColor = randomColor();
        },
        resetParent() {
            this.$emit('parent', null);
        },
        selectLabel(label) {
            this.$emit('parent', label);
        },
    },
};
</script>
