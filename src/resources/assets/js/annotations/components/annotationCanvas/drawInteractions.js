/**
 * Mixin for the annotationCanvas component that contains logic for the draw interactions.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas.drawInteractions', function () {
    var drawInteraction;

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
            maybeUpdateDrawInteractionMode: function (mode) {
                if (drawInteraction) {
                    this.map.removeInteraction(drawInteraction);
                    drawInteraction = undefined;
                }

                if (this.isDrawing) {
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
        },
        watch: {
            selectedLabel: function (label) {
                if (this.isDrawing && !label) {
                    this.resetInteractionMode();
                }
            },
        },
        created: function () {
            if (this.editable) {
                var keyboard = biigle.$require('keyboard');
                keyboard.on('a', this.drawPoint);
                keyboard.on('s', this.drawRectangle);
                keyboard.on('d', this.drawCircle);
                keyboard.on('D', this.drawEllipse);
                keyboard.on('f', this.drawLineString);
                keyboard.on('g', this.drawPolygon);
                this.$watch('interactionMode', this.maybeUpdateDrawInteractionMode);
            }
        },
    };
});
