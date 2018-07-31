/**
 * Mixin for the annotationCanvas component that contains logic for the draw interactions.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas.drawInteractions', function () {
    var drawInteraction,
        magicWandInteraction;

    return {
        computed: {
            isDrawing: function () {
                return this.interactionMode.startsWith('draw');
            },
            isDrawingPoint: function () {
                return this.interactionMode === 'drawPoint';
            },
            isDrawingRectangle: function () {
                return this.interactionMode === 'drawRectangle';
            },
            isDrawingCircle: function () {
                return this.interactionMode === 'drawCircle';
            },
            isDrawingLineString: function () {
                return this.interactionMode === 'drawLineString';
            },
            isDrawingPolygon: function () {
                return this.interactionMode === 'drawPolygon';
            },
            isDrawingEllipse: function () {
                return this.interactionMode === 'drawEllipse';
            },
            isMagicWanding: function () {
                return this.interactionMode === 'magicWand';
            },
        },
        methods: {
            draw: function (name) {
                if (this['isDrawing' + name]) {
                    this.resetInteractionMode();
                } else {
                    this.interactionMode = 'draw' + name;
                }
            },
            drawPoint: function () {
                this.draw('Point');
            },
            drawRectangle: function () {
                this.draw('Rectangle');
            },
            drawCircle: function () {
                this.draw('Circle');
            },
            drawLineString: function () {
                this.draw('LineString');
            },
            drawPolygon: function () {
                this.draw('Polygon');
            },
            drawEllipse: function () {
                this.draw('Ellipse');
            },
            toggleMagicWand: function () {
                if (this.isMagicWanding) {
                    this.resetInteractionMode();
                } else if (magicWandInteraction) {
                    this.interactionMode = 'magicWand';
                }
            },
        },
        watch: {
            selectedLabel: function (label) {
                if (!label && this.isDrawing) {
                    this.resetInteractionMode();
                }
            },
            interactionMode: function (mode) {
                if (drawInteraction) {
                    this.map.removeInteraction(drawInteraction);
                    drawInteraction = undefined;
                }

                if (this.editable && this.isDrawing) {
                    if (this.hasSelectedLabel) {
                        drawInteraction = new ol.interaction.Draw({
                            source: this.annotationSource,
                            type: mode.slice(4), // remove 'draw' prefix
                            style: this.styles.editing,
                        });
                        drawInteraction.on('drawend', this.handleNewFeature);
                        this.map.addInteraction(drawInteraction);
                    } else {
                        this.requireSelectedLabel();
                    }
                }
            },
            isMagicWanding: function (wanding) {
                if (magicWandInteraction) {
                    if (!wanding) {
                        magicWandInteraction.setActive(false);
                    } else if (this.hasSelectedLabel) {
                        magicWandInteraction.setActive(true);
                    } else {
                        this.requireSelectedLabel();
                    }
                }
            },
            image: function (image, oldImage) {
                // The magic wand interaction is unable to detect any change if the
                // image is switched. So if the interaction is currently active we
                // have to update it manually here.
                if (image && !image.tiled && this.isMagicWanding) {
                    magicWandInteraction.updateSnapshot();
                }

                // Swap source layers for the magic wand interaction if image types
                // change.
                if (image && magicWandInteraction) {
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
        },
        created: function () {
            var self = this;
            var keyboard = biigle.$require('keyboard');

            if (this.editable) {
                if (this.crossOrigin) {
                    keyboard.on('g', this.drawPolygon);
                } else {
                    keyboard.on('g', function (e) {
                        if (e.shiftKey) {
                            self.toggleMagicWand();
                        } else {
                            self.drawPolygon();
                        }
                    });
                }

                keyboard.on('a', this.drawPoint);
                keyboard.on('s', this.drawRectangle);
                keyboard.on('d', function (e) {
                    if (e.shiftKey) {
                        self.drawEllipse();
                    } else {
                        self.drawCircle();
                    }
                });
                keyboard.on('f', this.drawLineString);
            }
        },
        mounted: function () {
            // Initialize the magic wand interaction here because we have to wait for
            // the non-reactive properties of annotationCanvas to be initialized.
            // The magic wand interaction is not available for remote images.
            if (this.editable && !this.crossOrigin) {
                var MagicWandInteraction = biigle.$require('annotations.ol.MagicWandInteraction');
                magicWandInteraction = new MagicWandInteraction({
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
