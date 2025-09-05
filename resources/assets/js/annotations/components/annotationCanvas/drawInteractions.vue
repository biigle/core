<script>
import * as preventDoubleclick from '../../../prevent-doubleclick';
import DrawInteraction from '@biigle/ol/interaction/Draw';
import Keyboard from '@/core/keyboard.js';
import snapInteraction from '@/annotations/ol/snapInteraction.js';
import Styles from '@/annotations/stores/styles.js';
import { never } from '@biigle/ol/events/condition';
import { penTouchXorShift, penTouchOrShift } from '@/annotations/ol/events/condition.js';
import { Point } from '@biigle/ol/geom';


/**
 * Mixin for the annotationCanvas component that contains logic for the draw interactions.
 *
 * @type {Object}
 */

let drawInteraction;

export default {
    mixins: [snapInteraction],
    data() {
        return {
            drawEnded: true,
            lastDrawnPoint: new Point(0, 0),
            lastDrawnPointTime: 0,
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
            } else if (!this.hasSelectedLabel && !this.labelbotIsActive && this.canAdd) {
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
                    freehandCondition: this.getFreehandCondition(mode),
                    condition: this.updateSnapCoords
                });
                this.map.addInteraction(drawInteraction);

                drawInteraction.on('drawstart', () => {
                    this.drawEnded = false;
                });

                drawInteraction.on('drawend', (e) => {
                    this.drawEnded = true;

                    if (this.isDrawingPoint) {
                        if (this.isPointDoubleClick(e)) {
                            // The feature is added to the source only after this event
                            // is handled, so removal has to happen after the addfeature
                            // event.
                            this.annotationSource.once('addfeature', function () {
                                this.removeFeature(e.feature);
                            });
                            return;
                        }
                        this.lastDrawnPointTime = new Date().getTime();
                        this.lastDrawnPoint = e.feature.getGeometry();
                    }

                    this.handleNewFeature(e);
                });

                drawInteraction.on('drawabort', () => {
                    this.drawEnded = true;
                });
            }
        },
        isPointDoubleClick(e) {
            return new Date().getTime() - this.lastDrawnPointTime < preventDoubleclick.POINT_CLICK_COOLDOWN
                && preventDoubleclick.computeDistance(this.lastDrawnPoint,e.feature.getGeometry()) < preventDoubleclick.POINT_CLICK_DISTANCE;
        },
        getFreehandCondition(mode) {
            if (mode === 'drawCircle') {
                return penTouchOrShift;
            }

            if (mode === 'drawLineString' || mode === 'drawPolygon') {
                return penTouchXorShift;
            }

            return never;
        },
    },
    watch: {
        selectedLabel(label) {
            if (this.isDrawing && !label && !this.labelbotIsActive) {
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
