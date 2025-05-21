<script>
import ExampleAnnotations from '@/largo/components/exampleAnnotations.vue';
import Keyboard from '@/core/keyboard.js';
import LabelTrees from '@/label-trees/components/labelTrees.vue';
import powerToggle from '../../core/components/powerToggle.vue';

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
        'change-labelbot-toggle'
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
            labelbotIsDisabled: false,
        };
    },
    props: {
        focusInput:{
            type: Boolean,
            default: false,
        },
        showExampleAnnotations: {
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
    watch: {
        labelTrees() {
            this.labelbotIsDisabled = this.labelTrees.every(tree => tree.labels.length === 0);
        }
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
            // Deselect the selected label when LabelBOT is on
            if (this.selectedLabel) {
                this.handleDeselectedLabel();
            }

            this.$emit('change-labelbot-toggle', true);
        },
        handleLabelbotOff() {
            this.$emit('change-labelbot-toggle', false);
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
