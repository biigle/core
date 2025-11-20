<script>
import ExampleAnnotations from '@/largo/components/exampleAnnotations.vue';
import Keyboard from '@/core/keyboard.js';
import LabelTrees from '@/label-trees/components/labelTrees.vue';
import { LABELBOT_STATES } from '../mixins/labelbot.vue';

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
        'update-labelbot-state',
    ],
    components: {
        labelTrees: LabelTrees,
        exampleAnnotations: ExampleAnnotations,
    },
    data() {
        return {
            labelTrees: [],
            selectedLabel: null,
            focusInputFindlabel: false,
            showLabelbotInfo: false,
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
        labelbotState: {
            type: String,
            required: true,
        },
    },
    computed: {
        plugins() {
            return plugins;
        },
        labelbotIsActive() {
            return this.labelbotState !== LABELBOT_STATES.TILEDIMAGE && this.labelbotState !== LABELBOT_STATES.OFF && !this.labelbotIsDisabled;
        },
        labelbotIsDisabled() {
            return this.labelbotState === LABELBOT_STATES.NOLABELS || this.labelbotState === LABELBOT_STATES.CORSERROR;
        },
        labelbotToggleTitle() {
            switch (this.labelbotState) {
                case LABELBOT_STATES.OFF:
                case LABELBOT_STATES.TILEDIMAGE:
                    return 'Enable LabelBOT';
                case LABELBOT_STATES.CORSERROR:
                    return 'The remote image must have a proper CORS configuration';
                case LABELBOT_STATES.NOLABELS:
                    return 'There must be at least one label in one of the label trees';
                default:
                    return 'Disable LabelBOT';
            }
        },
    },
    watch: {
        labelbotState() {
            if (this.labelbotIsActive) {
                this.$refs.labelTrees.clear();
            }
        },
    },
    methods: {
        handleSelectedLabel(label) {
            // Turn off LabelBOT if its on
            if (this.labelbotIsActive) {
                this.handleLabelbotOff();
            }

            this.selectedLabel = label;
            this.$emit('select', label);
        },
        handleDeselectedLabel() {
            this.selectedLabel = null;
            this.$emit('select', null);
        },
        toggleLabelBot() {
            if (this.labelbotIsActive) {
                this.handleLabelbotOff();
            } else {
                this.handleLabelbotOn();
            }
        },
        handleLabelbotOn() {
            // Deselect the selected label when LabelBOT is on
            if (this.selectedLabel) {
                this.handleDeselectedLabel();
            }
            this.$emit('update-labelbot-state', LABELBOT_STATES.READY);
        },
        handleLabelbotOff() {
            this.$emit('update-labelbot-state', LABELBOT_STATES.OFF);
        },
        setFocusInputFindLabel() {
            this.$emit('open', 'labels');
            this.focusInputFindlabel = false;
            this.$nextTick(() => {
                this.focusInputFindlabel = true;
            });
        },
        toggleLabelbotInfo() {
            this.showLabelbotInfo = !this.showLabelbotInfo;
        },
    },
    created() {
        this.labelTrees = biigle.$require('annotations.labelTrees');

        Keyboard.on('control+k', this.setFocusInputFindLabel, 0, this.listenerSet);
        Keyboard.on('Backquote', this.toggleLabelBot, 0, this.listenerSet);
    },
};
</script>
