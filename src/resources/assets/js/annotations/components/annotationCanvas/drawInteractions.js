/**
 * Mixin for the annotationCanvas component that contains logic for the draw interactions.
 *
 * @type {Object}
 */

biigle.$component('annotations.components.annotationCanvas.drawInteractions', function () {
    var drawInteraction;

    // Custom OpenLayers freehandCondition that is true if a pen is used for input or
    // if Shift is pressed otherwise.
    var penOrShift = function (mapBrowserEvent) {
      var pointerEvent = mapBrowserEvent.pointerEvent;

      if (pointerEvent && pointerEvent.pointerType === "pen") {
        return true;
      }

      return ol.events.condition.shiftKeyOnly(mapBrowserEvent);
    };

    return {
        computed: {
            isDrawing() {
                return this.interactionMode.startsWith('draw');
            },
            isDrawingPoint() {
                return this.interactionMode === 'drawPoint';
            },
            isDrawingRectangle() {
                return this.interactionMode === 'drawRectangle';
            },
            isDrawingCircle() {
                return this.interactionMode === 'drawCircle';
            },
            isDrawingLineString() {
                return this.interactionMode === 'drawLineString';
            },
            isDrawingPolygon() {
                return this.interactionMode === 'drawPolygon';
            },
            isDrawingEllipse() {
                return this.interactionMode === 'drawEllipse';
            },
        },
        methods: {
            draw(name) {
                if (this['isDrawing' + name]) {
                    this.resetInteractionMode();
                } else if (!this.hasSelectedLabel) {
                    this.requireSelectedLabel();
                } else if (this.canAdd) {
                    this.interactionMode = 'draw' + name;
                }
            },
            drawPoint() {
                this.draw('Point');
            },
            drawRectangle() {
                this.draw('Rectangle');
            },
            drawCircle() {
                this.draw('Circle');
            },
            drawLineString() {
                this.draw('LineString');
            },
            drawPolygon() {
                this.draw('Polygon');
            },
            drawEllipse() {
                this.draw('Ellipse');
            },
            maybeUpdateDrawInteractionMode(mode) {
                if (drawInteraction) {
                    this.map.removeInteraction(drawInteraction);
                    drawInteraction = undefined;
                }

                if (this.isDrawing) {
                    drawInteraction = new ol.interaction.Draw({
                        source: this.annotationSource,
                        type: mode.slice(4), // remove 'draw' prefix
                        style: this.styles.editing,
                        freehandCondition: penOrShift,
                    });
                    drawInteraction.on('drawend', this.handleNewFeature);
                    this.map.addInteraction(drawInteraction);
                }
            },
        },
        watch: {
            selectedLabel(label) {
                if (this.isDrawing && !label) {
                    this.resetInteractionMode();
                }
            },
        },
        created() {
            if (this.canAdd) {
                var kb = biigle.$require('keyboard');
                kb.on('a', this.drawPoint, 0, this.listenerSet);
                kb.on('s', this.drawRectangle, 0, this.listenerSet);
                kb.on('d', this.drawCircle, 0, this.listenerSet);
                kb.on('Shift+d', this.drawEllipse, 0, this.listenerSet);
                kb.on('f', this.drawLineString, 0, this.listenerSet);
                kb.on('g', this.drawPolygon, 0, this.listenerSet);
                this.$watch('interactionMode', this.maybeUpdateDrawInteractionMode);
            }
        },
    };
});
