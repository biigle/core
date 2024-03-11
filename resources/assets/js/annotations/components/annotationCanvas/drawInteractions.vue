<script>
import DrawInteraction from '@biigle/ol/interaction/Draw';
import Keyboard from '../../../core/keyboard';
import Styles from '../../stores/styles';
import { shiftKeyOnly } from '@biigle/ol/events/condition';
import snapInteraction from '../../snapInteraction.vue';
import { registerLoading } from 'echarts/core';

/**
 * Mixin for the annotationCanvas component that contains logic for the draw interactions.
 *
 * @type {Object}
 */

let drawInteraction;

// Custom OpenLayers freehandCondition that is true if a pen is used for input or
// if Shift is pressed otherwise.
let penOrShift = function (mapBrowserEvent) {
  let pointerEvent = mapBrowserEvent.pointerEvent;

  if (pointerEvent && pointerEvent.pointerType === "pen") {
    return true;
  }

  return shiftKeyOnly(mapBrowserEvent);
};

export default {
    mixins: [snapInteraction],
    data() {
        return {
            snappingCoords: [0, 0],
            drawEnded: true,
            shouldSnap: false,
        }
    },
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
            } else if (!this.hasSelectedLabel && this.canAdd) {
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
                drawInteraction = new DrawInteraction({
                    source: this.annotationSource,
                    type: mode.slice(4), // remove 'draw' prefix
                    style: Styles.editing,
                    freehandCondition: penOrShift,
                    condition: this.updateSnapCoords
                });
                this.map.addInteraction(drawInteraction);

                drawInteraction.on('drawstart', () => {
                    this.drawEnded = false;
                });

                drawInteraction.on('drawend', (e) => {
                    this.handleNewFeature(e);
                    this.drawEnded = true;
                });
            }
        },
        updateSnapCoords(mapBrowserEvent) {
            this.snappingCoords = mapBrowserEvent.coordinate;
            this.shouldSnap = mapBrowserEvent.originalEvent.ctrlKey;
            return true;
        }

    },
    watch: {
        selectedLabel(label) {
            if (this.isDrawing && !label) {
                this.resetInteractionMode();
            }
        },
        interactionMode(mode) {
            this.maybeUpdateDrawInteractionMode(mode)

        },
    },
    created() {
        Keyboard.on('a', this.drawPoint, 0, this.listenerSet);
        Keyboard.on('s', this.drawRectangle, 0, this.listenerSet);
        Keyboard.on('d', this.drawCircle, 0, this.listenerSet);
        Keyboard.on('Shift+d', this.drawEllipse, 0, this.listenerSet);
        Keyboard.on('f', this.drawLineString, 0, this.listenerSet);
        Keyboard.on('g', this.drawPolygon, 0, this.listenerSet);
    }
};
</script>
