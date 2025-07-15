<script>
import LabelbotIndicator from '../labelbotIndicator.vue';
import LabelbotPopup from '../labelbotPopup.vue';
import { LABELBOT_STATES } from '../../mixins/labelbot.vue';

export default {
    emits: [
        'change-labelbot-focused-popup',
        'close-labelbot-popup',
    ],
    props: {
        labelbotState: {
            type: String,
            required: true,
        },
        labelbotOverlays: {
            type: Array,
            default() {
                return [];
            },
        },
        focusedPopupKey: {
            type: Number,
            default: -1,
        },
        labelbotTimeout: {
            type: Number,
            default: 1,
        },
    },
    components: {
        labelbotPopup: LabelbotPopup,
        labelbotIndicator: LabelbotIndicator
    },
    computed: {
        labelbotIsActive() {
            return this.labelbotState === LABELBOT_STATES.INITIALIZING || this.labelbotState === LABELBOT_STATES.READY || this.labelbotState === LABELBOT_STATES.COMPUTING || this.labelbotState === LABELBOT_STATES.BUSY;
        },
    },
    methods: {
        updateLabelbotLabel(event) {
            this.$emit('swap', event.annotation, event.label);
        },
        closeLabelbotPopup(popup) {
            this.$emit('close-labelbot-popup', popup);
        },
        handleLabelbotPopupFocused(popup) {
            this.$emit('change-labelbot-focused-popup', popup);
        },
        handleDeleteLabelbotAnnotation(annotation) {
            this.$emit('delete', [annotation]);
        },
    },
    watch: {
        labelbotState() {
            // We should always reset interaction mode when LabelBOT's state is changed
            // to OFF/Disabled and no Label is selected to avoid empty annotation (blue
            // features).
            if (!this.labelbotIsActive && !this.selectedLabel) {
                this.resetInteractionMode();
            }
        },
    },
};
</script>
