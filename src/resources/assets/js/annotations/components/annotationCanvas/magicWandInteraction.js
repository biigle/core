/**
 * Mixin for the annotationCanvas component that contains logic for the magic wand interaction.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas.magicWandInteraction', function () {
    var magicWandInteraction;

    return {
        computed: {
            crossOrigin: function () {
                return this.image && this.image.crossOrigin;
            },
            isMagicWanding: function () {
                return this.interactionMode === 'magicWand' && !this.crossOrigin;
            },
        },
        methods: {
            toggleMagicWand: function () {
                if (this.isMagicWanding) {
                    this.resetInteractionMode();
                } else if (magicWandInteraction) {
                    this.interactionMode = 'magicWand';
                }
            },
            maybeUpdateMagicWandSnapshot: function (image) {
                // The magic wand interaction is unable to detect any change if the
                // image is switched. So if the interaction is currently active we
                // have to update it manually here.
                if (image && !image.tiled && this.isMagicWanding) {
                    magicWandInteraction.updateSnapshot();
                }
            },
            maybeSetMagicWandLayer: function (image, oldImage) {
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
            toggleMagicWandInteraction: function (isMagicWanding) {
                if (!isMagicWanding) {
                    magicWandInteraction.setActive(false);
                } else if (this.hasSelectedLabel) {
                    magicWandInteraction.setActive(true);
                } else {
                    this.requireSelectedLabel();
                }
            }
        },
        created: function () {
            if (this.editable) {
                biigle.$require('keyboard').on('G', this.toggleMagicWand);
                this.$watch('image', this.maybeUpdateMagicWandSnapshot);
                this.$watch('image', this.maybeSetMagicWandLayer);
                this.$watch('isMagicWanding', this.toggleMagicWandInteraction);
            }
        },
        mounted: function () {
            // Initialize the magic wand interaction here because we have to wait for
            // the non-reactive properties of annotationCanvas to be initialized.
            // The magic wand interaction is not available for remote images.
            if (this.editable) {
                var Interaction = biigle.$require('annotations.ol.MagicWandInteraction');
                magicWandInteraction = new Interaction({
                    map: this.map,
                    source: this.annotationSource,
                    style: this.styles.editing,
                    indicatorPointStyle: this.styles.editing,
                    indicatorCrossStyle: this.styles.cross,
                    simplifyTolerant: 0.1,
                });
                magicWandInteraction.on('drawend', this.handleNewFeature);
                magicWandInteraction.setActive(false);
                this.map.addInteraction(magicWandInteraction);
            }
        },
    };
});
