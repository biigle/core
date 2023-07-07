<script>
import Keyboard from '../../../core/keyboard';
import TranslateInteraction from '../../ol/TranslateInteraction';

/**
 * Mixin for the annotationCanvas component that contains logic for the translate interaction.
 *
 * @type {Object}
 */
let translateInteraction;

export default {
    computed: {
        isTranslating() {
            return this.interactionMode === 'translate';
        },
    },
    methods: {
        toggleTranslating() {
            if (this.isTranslating) {
                this.resetInteractionMode();
            } else if (!this.modifyInProgress && this.canModify) {
                this.interactionMode = 'translate';
            }
        },
    },
    watch: {
        isTranslating(translating) {
            translateInteraction.setActive(translating);
        },
    },
    created() {
        Keyboard.on('m', this.toggleTranslating, 0, this.listenerSet);
    },
    mounted() {
        // Initialize the translate interaction here because we have to wait for
        // the non-reactive properties of annotationCanvas to be initialized.
        translateInteraction = new TranslateInteraction({
            features: this.selectInteraction.getFeatures(),
            map: this.map,
        });
        translateInteraction.setActive(false);
        translateInteraction.on('translatestart', this.handleFeatureModifyStart);
        translateInteraction.on('translateend', this.handleFeatureModifyEnd);
        this.map.addInteraction(translateInteraction);
    },
};
</script>
