<script>
import LabelTrees from '../../label-trees/components/labelTrees';
import powerToggle from '../../core/components/powerToggle.vue';
import Messages from '../../core/messages/store';

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
        powerToggle: powerToggle,
    },
    data() {
        return {
            labelTrees: [],
            selectedLabel: null,
            labelBOTIsOn: false,
        };
    },
    computed: {
        plugins() {
            return plugins;
        },
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
        activateLabelBOT() {
            if (!this.labelTrees.every(tree => tree.labels.length === 0)) {
                this.labelBOTIsOn = true;
            } else {
                Messages.warning("LabelBOT can't be activated! There must be at least one label in one of the label trees.");
            }
        },
        deactivateLabelBOT() {
            this.labelBOTIsOn = false;
        }
    },
    created() {
        this.labelTrees = biigle.$require('annotations.labelTrees');
    },
};
</script>

