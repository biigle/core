/**
 * Mixin for the annotationCanvas component that contains logic for the translate interaction.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas.translateInteraction', function () {
    var translateInteraction;

    return {
        computed: {
            isTranslating: function () {
                return this.interactionMode === 'translate';
            },
        },
        methods: {
            toggleTranslating: function () {
                if (this.isTranslating) {
                    this.resetInteractionMode();
                } else {
                    this.interactionMode = 'translate';
                }
            },
        },
        watch: {
            isTranslating: function (translating) {
                if (this.editable) {
                    translateInteraction.setActive(translating);
                }
            },
        },
        mounted: function () {
            // Initialize the translate interaction here because we have to wait for
            // the non-reactive properties of annotationCanvas to be initialized.
            if (this.editable) {
                var Interaction = biigle.$require('annotations.ol.ExtendedTranslateInteraction');
                translateInteraction = new Interaction({
                    features: this.selectInteraction.getFeatures(),
                    map: this.map,
                });
                translateInteraction.setActive(false);
                translateInteraction.on('translatestart', this.handleFeatureModifyStart);
                translateInteraction.on('translateend', this.handleFeatureModifyEnd);
                this.map.addInteraction(translateInteraction);
                biigle.$require('keyboard').on('m', this.toggleTranslating);
            }
        },
    };
});
