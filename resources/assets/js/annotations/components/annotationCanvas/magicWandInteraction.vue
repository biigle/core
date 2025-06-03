<script>
import Keyboard from '@/core/keyboard.js';
import MagicWandInteraction from '@/annotations/ol/MagicWandInteraction.js';
import Messages from '@/core/messages/store.js';
import { LABELBOT_STATES } from '../../mixins/labelbot.vue';
import Styles from '@/annotations/stores/styles.js';

/**
 * Mixin for the annotationCanvas component that contains logic for the magic wand interaction.
 *
 * @type {Object}
 */
let magicWandInteraction;

export default {
    computed: {
        crossOrigin() {
            return this.image && this.image.crossOrigin;
        },
        isMagicWanding() {
            return this.interactionMode === 'magicWand' && !this.crossOrigin;
        },
    },
    methods: {
        toggleMagicWand() {
            if (this.isMagicWanding) {
                this.resetInteractionMode();
            } else if (magicWandInteraction && this.canAdd) {
                this.interactionMode = 'magicWand';
            }
        },
        maybeUpdateMagicWandSnapshot(image) {
            // The magic wand interaction is unable to detect any change if the
            // image is switched. So if the interaction is currently active we
            // have to update it manually here.
            if (image && !image.tiled && this.isMagicWanding) {
                magicWandInteraction.updateSnapshot();
            }
        },
        maybeSetMagicWandLayer(image, oldImage) {
            // Swap source layers for the magic wand interaction if image types
            // change.
            if (image && !this.crossOrigin) {
                if (image.tiled === true) {
                    if (!oldImage || oldImage.tiled !== true) {
                        magicWandInteraction.setLayer(this.tiledImageLayer);
                    }
                } else {
                    if (!oldImage || oldImage.tiled === true) {
                        magicWandInteraction.setLayer(this.imageLayer);
                    }
                }
            }
        },
        toggleMagicWandInteraction(isMagicWanding) {
            if (!isMagicWanding) {
                magicWandInteraction.setActive(false);
            } else if (this.hasSelectedLabel || this.labelbotState === LABELBOT_STATES.READY) {
                magicWandInteraction.setActive(true);
            } else if (this.labelbotState === LABELBOT_STATES.BUSY) {
                Messages.info("The maximum number of LabelBOT's requests is reached!")
            } else {
                this.requireSelectedLabel();
            }
        }
    },
    watch: {
        isMagicWanding(isMagicWanding) {
            this.toggleMagicWandInteraction(isMagicWanding);
        },
    },
    created() {
        this.$watch('image', this.maybeUpdateMagicWandSnapshot);
        this.$watch('image', this.maybeSetMagicWandLayer);
        Keyboard.on('Shift+g', this.toggleMagicWand, 0, this.listenerSet);
    },
    mounted() {
        // Initialize the magic wand interaction here because we have to wait for
        // the non-reactive properties of annotationCanvas to be initialized.
        magicWandInteraction = new MagicWandInteraction({
            map: this.map,
            source: this.annotationSource,
            style: Styles.editing,
            indicatorPointStyle: Styles.editing,
            indicatorCrossStyle: Styles.cross,
            simplifyTolerant: 0.1,
        });
        magicWandInteraction.on('drawend', this.handleNewFeature);
        magicWandInteraction.setActive(false);
        this.map.addInteraction(magicWandInteraction);
    },
};
</script>
