/**
 * Mixin for the annotationCanvas component that contains logic for the attach label interaction.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas.attachLabelInteraction', function () {
    var attachLabelInteraction;

    return {
        computed: {
            isAttaching() {
                return this.interactionMode === 'attach';
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
            handleAttachLabel(e) {
                this.$emit('attach', e.feature.get('annotation'), this.selectedLabel);
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
            selectedLabel(label) {
                if (!label && this.isAttaching) {
                    this.resetInteractionMode();
                }
            },
        },
        mounted() {
            // Initialize the attach interaction here because we have to wait for
            // the non-reactive properties of annotationCanvas to be initialized.
            if (this.canAdd) {
                var Interaction = biigle.$require('annotations.ol.AttachLabelInteraction');
                attachLabelInteraction = new Interaction({
                    features: this.annotationFeatures,
                    map: this.map,
                });
                attachLabelInteraction.setActive(false);
                attachLabelInteraction.on('attach', this.handleAttachLabel);
                this.map.addInteraction(attachLabelInteraction);

                biigle.$require('keyboard').on('l', this.toggleAttaching, 0, this.listenerSet);
            }
        },
    };
});
