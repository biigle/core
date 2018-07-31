/**
 * Mixin for the annotationCanvas component that contains logic for the attach label interaction.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas.attachLabelInteraction', function () {
    var attachLabelInteraction;

    return {
        computed: {
            isAttaching: function () {
                return this.interactionMode === 'attach';
            },
        },
        methods: {
            toggleAttaching: function () {
                if (this.isAttaching) {
                    this.resetInteractionMode();
                } else {
                    this.interactionMode = 'attach';
                }
            },
            handleAttachLabel: function (e) {
                this.$emit('attach', e.feature.get('annotation'), this.selectedLabel);
            },
        },
        watch: {
            isAttaching: function (attaching) {
                if (this.editable) {
                    if (attaching && !this.hasSelectedLabel) {
                        this.requireSelectedLabel();
                    } else {
                        attachLabelInteraction.setActive(attaching);
                    }
                }
            },
            selectedLabel: function (label) {
                if (!label && this.isAttaching) {
                    this.resetInteractionMode();
                }
            },
        },
        mounted: function () {
            // Initialize the attach interaction here because we have to wait for
            // the non-reactive properties of annotationCanvas to be initialized.
            if (this.editable) {
                var AttachLabelInteraction = biigle.$require('annotations.ol.AttachLabelInteraction');
                attachLabelInteraction = new AttachLabelInteraction({
                    features: this.annotationFeatures,
                    map: this.map,
                });
                attachLabelInteraction.setActive(false);
                attachLabelInteraction.on('attach', this.handleAttachLabel);
                this.map.addInteraction(attachLabelInteraction);

                biigle.$require('keyboard').on('l', this.toggleAttaching);
            }
        },
    };
});
