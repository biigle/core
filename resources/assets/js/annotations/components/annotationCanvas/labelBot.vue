<script>
import LabelbotIndicator from '../labelbotIndicator.vue';
import LabelbotPopup from '../labelbotPopup.vue';
import Styles from '../../stores/styles.js';
import VectorLayer from '@biigle/ol/layer/Vector';
import VectorSource from '@biigle/ol/source/Vector';
import { LABELBOT_STATES } from '../../mixins/labelbot.vue';

export default {
    emits: [
        'change-labelbot-focused-popup',
        'close-labelbot-popup',
    ],
    props: {
        labelbotState: {
            type: String,
            default: null,
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
    data() {
        return {
            labelBotLayerAdded: false,
        };
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
        labelbotIsActive(active) {
            if (active && !this.labelBotLayerAdded) {
                this.map.addLayer(this.labelbotLayer);
                this.labelBotLayerAdded = true;
            }
        }
    },
    created() {
        // Layer for LabelBOT popup dashed line and editing annotation with opacity=1.
        // These variables should not be reactive.
        this.labelbotSource = new VectorSource();

        this.labelbotLayer = new VectorLayer({
            source: this.labelbotSource,
            zIndex: 101, // above annotationLayer
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            style: Styles.features,
            opacity: 1, // opacity not configurable
        });
    },
};
</script>
