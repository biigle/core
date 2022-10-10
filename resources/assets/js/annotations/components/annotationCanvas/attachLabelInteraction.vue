<script>
import AttachLabelInteraction from '../../ol/AttachLabelInteraction';
import Keyboard from '../../../core/keyboard';

/**
 * Mixin for the annotationCanvas component that contains logic for the attach label interaction.
 *
 * @type {Object}
 */
let attachLabelInteraction, swapLabelInteraction;

export default {
    computed: {
        isAttaching() {
            return this.interactionMode === 'attach';
        },
        isSwapping() {
            return this.interactionMode === 'swap';
        },
    },
    methods: {
        toggleAttaching() {
            if (this.isAttaching) {
                this.resetInteractionMode();
            } else {
                this.interactionMode = 'attach';
            }
        },
        toggleSwapping() {
            if (this.isSwapping) {
                this.resetInteractionMode();
            } else {
                this.interactionMode = 'swap';
            }
        },
        handleAttachLabel(e) {
            this.$emit('attach', e.feature.get('annotation'), this.selectedLabel);
        },
        handleSwapLabel(e) {
            this.$emit('swap', e.feature.get('annotation'), this.selectedLabel);
        },
    },
    watch: {
        isAttaching(attaching) {
            if (this.canAdd) {
                if (attaching && !this.hasSelectedLabel) {
                    this.requireSelectedLabel();
                } else {
                    attachLabelInteraction.setActive(attaching);
                }
            }
        },
        isSwapping(swapping) {
            if (this.canAdd) {
                if (swapping && !this.hasSelectedLabel) {
                    this.requireSelectedLabel();
                } else {
                    swapLabelInteraction.setActive(swapping);
                }
            }
        },
        selectedLabel(label) {
            if (!label && (this.isAttaching || this.isSwapping)) {
                this.resetInteractionMode();
            }
        },
    },
    mounted() {
        // Initialize the attach interaction here because we have to wait for
        // the non-reactive properties of annotationCanvas to be initialized.
        if (this.canAdd) {
            attachLabelInteraction = new AttachLabelInteraction({
                features: this.annotationFeatures,
                map: this.map,
            });
            attachLabelInteraction.setActive(false);
            attachLabelInteraction.on('attach', this.handleAttachLabel);
            this.map.addInteraction(attachLabelInteraction);

            swapLabelInteraction = new AttachLabelInteraction({
                features: this.annotationFeatures,
                map: this.map,
            });
            swapLabelInteraction.setActive(false);
            swapLabelInteraction.on('attach', this.handleSwapLabel);
            this.map.addInteraction(swapLabelInteraction);

            Keyboard.on('l', this.toggleAttaching, 0, this.listenerSet);
            Keyboard.on('Shift+l', this.toggleSwapping, 0, this.listenerSet);
        }
    },
};
</script>
