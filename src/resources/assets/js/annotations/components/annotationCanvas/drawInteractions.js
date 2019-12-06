/**
 * Mixin for the annotationCanvas component that contains logic for the draw interactions.
 *
 * @type {Object}
 */

biigle.$component('annotations.components.annotationCanvas.drawInteractions', function () {
    var drawInteraction;

    var penOrShift = function(mapBrowserEvent) {
      var pointerEvt = (mapBrowserEvent).pointerEvent;
      return pointerEvt.pointerType === "pen" || pointerEvt.shiftKey;
    };

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
                } else if (!this.hasSelectedLabel) {
                    this.requireSelectedLabel();
                } else if (this.canAdd) {
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
                    drawInteraction = new ol.interaction.Draw({
                        source: this.annotationSource,
                        type: mode.slice(4), // remove 'draw' prefix
                        style: this.styles.editing,
                        freehandCondition: penOrShift
                    });
                    drawInteraction.on('drawend', this.handleNewFeature);
                    this.map.addInteraction(drawInteraction);
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
