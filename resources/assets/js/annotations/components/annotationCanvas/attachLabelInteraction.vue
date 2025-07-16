<script>
import AttachLabelInteraction from '@/annotations/ol/AttachLabelInteraction.js';
import Keyboard from '@/core/keyboard.js';

/**
 * Mixin for the annotationCanvas component that contains logic for the attach label interaction.
 *
 * @type {Object}
 */
let attachLabelInteraction, swapLabelInteraction;

export default {
    emits: [
        'attach',
        'swap',
        'force-swap',
    ],
    computed: {
        isAttaching() {
            return this.interactionMode === 'attach';
        },
        isSwapping() {
            return this.interactionMode === 'swap';
        },
        isForceSwapping() {
            return this.interactionMode === 'force-swap';
        },
    },
    methods: {
        toggleAttaching() {
            if (this.isAttaching) {
                this.resetInteractionMode();
            } else if (this.canAdd) {
                this.interactionMode = 'attach';
            }
        },
        toggleSwapping() {
            if (this.isSwapping) {
                this.resetInteractionMode();
            } else if (this.canAdd){
                this.interactionMode = 'swap';
            }
        },
        toggleForceSwapping() {
            if (this.isForceSwapping) {
                this.resetInteractionMode();
            } else if (this.canAdd){
                this.interactionMode = 'force-swap';
            }
        },
        handleAttachLabel(e) {
            this.$emit('attach', e.feature.get('annotation'), this.selectedLabel);
        },
        handleSwapLabel(e) {
            if (this.isSwapping) {
                this.$emit('swap', e.feature.get('annotation'), this.selectedLabel);
            } else if (this.isForceSwapping) {
                this.$emit('force-swap', e.feature.get('annotation'), this.selectedLabel);
            }
        },
    },
    watch: {
        isAttaching(attaching) {
            if (attaching && !this.hasSelectedLabel) {
                this.requireSelectedLabel();
            } else {
                attachLabelInteraction.setActive(attaching);
            }

        },
        isSwapping(swapping) {
            if (swapping && !this.hasSelectedLabel) {
                this.requireSelectedLabel();
            } else {
                swapLabelInteraction.setActive(swapping);
            }
        },
        isForceSwapping(swapping) {
            if (swapping && !this.hasSelectedLabel) {
                this.requireSelectedLabel();
            } else {
                swapLabelInteraction.setActive(swapping);
            }
        },
        selectedLabel(label) {
            if (!label && (this.isAttaching || this.isSwapping || this.isForceSwapping)) {
                this.resetInteractionMode();
            }
        },
    },
    mounted() {
        // Initialize the attach interaction here because we have to wait for
        // the non-reactive properties of annotationCanvas to be initialized.
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
    },
};
</script>
