<script>
import LabelTrees from '../../label-trees/components/labelTrees';
import Keyboard from '../../core/keyboard';
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
            labelbotIsOn: false,
            focusInputFindlabel: false,
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
    methods: {
        handleSelectedLabel(label) {
            if (this.labelbotIsOn) {
                Messages.warning("Please turn off LabelBOT first to select a label!");
            } else {
                this.selectedLabel = label;
                this.$emit('select', label);
            }
        },
        handleDeselectedLabel() {
            this.selectedLabel = null;
            this.$emit('select', null);
        },
        handleLabelBOT() {
            if (this.labelbotIsOn) {
                this.labelbotIsOn = false;
                this.$emit('labelbot', false);
                return;
            }

            if (this.selectedLabel) {
                Messages.warning("LabelBOT can't be activated! Please deselect the selected label!");
            }
            else if (this.labelTrees.every(tree => tree.labels.length === 0)) {
                Messages.warning("LabelBOT can't be activated! There must be at least one label in one of the label trees.");
            } else {
                this.labelbotIsOn = true;
                this.$emit('labelbot', true);
            }
        },
        setFocusInputFindLabel() {
            this.$emit('open', 'labels');
            this.focusInputFindlabel = false;
            this.$nextTick(() => {
                this.focusInputFindlabel = true;
            });
        },
    },
    created() {
        this.labelTrees = biigle.$require('annotations.labelTrees');

        Keyboard.on('control+k', this.setFocusInputFindLabel, 0, this.listenerSet);
    },
};
</script>
