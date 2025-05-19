<script>
import ExampleAnnotations from '@/largo/components/exampleAnnotations.vue';
import Keyboard from '@/core/keyboard.js';
import LabelTrees from '@/label-trees/components/labelTrees.vue';
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
    template: '#labels-tab-template',
    emits: [
        'open',
        'select',
    ],
    components: {
        labelTrees: LabelTrees,
        exampleAnnotations: ExampleAnnotations,
        powerToggle: powerToggle,
    },
    data() {
        return {
            labelTrees: [],
            selectedLabel: null,
            focusInputFindlabel: false,
        };
    },
    props: {
        focusInput:{
            type: Boolean,
            default: false,
        },
        labelbotIsOn: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        plugins() {
            return plugins;
        },
    },
    methods: {
        handleSelectedLabel(label) {
            // Turn off LabelBOT if its on
            if (this.labelbotIsOn) {
                this.handleLabelbotOff();
            }

            this.selectedLabel = label;
            this.$emit('select', label);
        },
        handleDeselectedLabel() {
            this.selectedLabel = null;
            this.$emit('select', null);
        },
        handleLabelbotOn() {
            if (this.labelTrees.every(tree => tree.labels.length === 0)) {
                Messages.info("LabelBOT can't be activated! There must be at least one label in one of the label trees.");
                return;
            }

            // Deselect the selected label when LabelBOT is on
            if (this.selectedLabel) {
                this.handleDeselectedLabel();
            }

            this.$emit('change', 'labelbot', true);
        },
        handleLabelbotOff() {
            this.$emit('change', 'labelbot', false);
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
