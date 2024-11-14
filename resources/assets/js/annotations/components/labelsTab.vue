<script>
import LabelTrees from '../../label-trees/components/labelTrees';

/**
 * Additional components that can be dynamically added by other Biigle modules via
 * view mixins. These components are meant for the "annotationsLabelsTab" view mixin
 * mount point.
 *
 * @type {Object}
 */
export let plugins = {};

/**
 * The labels tab of the annotator
 *
 * @type {Object}
 */
export default {
    components: {
        labelTrees: LabelTrees,
    },
    data() {
        return {
            labelTrees: [],
            selectedLabel: null,
        };
    },
    props: {
        focusInput:{
            type: Boolean,
            default: false,
        }
    },
    computed: {
        plugins() {
            return plugins;
        },
    },
    watch: {
        focusInput(){
        }
    },
    methods: {
        handleSelectedLabel(label) {
            this.selectedLabel = label;
            this.$emit('select', label);
        },
        handleDeselectedLabel() {
            this.selectedLabel = null;
            this.$emit('select', null);
        },
    },
    created() {
        this.labelTrees = biigle.$require('annotations.labelTrees');
    },
};
</script>
