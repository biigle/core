<script>
import {simplifyPolygon} from "../../../annotations/ol/PolygonValidator";
import DrawInteraction from '@biigle/ol/interaction/Draw';
import Keyboard from '../../../core/keyboard';
import Styles from '../../../annotations/stores/styles';
import VectorLayer from '@biigle/ol/layer/Vector';
import VectorSource from '@biigle/ol/source/Vector';
import snapInteraction from "./snapInteraction.vue";
import { isInvalidShape } from '../../../annotations/utils';
import settings from "../../stores/settings";
import { Point } from '@biigle/ol/geom';

function computeDistance(point1, point2) {
    let p1 = point1.getCoordinates();
    let p2 = point2.getCoordinates();
    return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
}

/**
 * Mixin for the videoScreen component that contains logic for the draw interactions.
 *
 * @type {Object}
 */

const POINT_CLICK_COOLDOWN = 400;
const POINT_CLICK_DISTANCE = 5;

export default {
    mixins: [snapInteraction],
    data() {
        return {
            pendingAnnotation: {},
            autoplayDrawTimeout: null,
            drawEnded: true,
            lastDrawnPoint: new Point(0, 0),
            lastDrawnPointTime: 0,
        };
    },
    computed: {
        hasSelectedLabel() {
            return !!this.selectedLabel;
        },
        hasNoSelectedLabel() {
            return !this.selectedLabel;
        },
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
        isDrawingWholeFrame() {
            return this.interactionMode === 'drawWholeFrame';
        },
        hasPendingAnnotation() {
            if (this.isDrawingWholeFrame) {
                return this.pendingAnnotation.shape && this.pendingAnnotation.frames.length > 0 && this.pendingAnnotation.points.length === 0;
            }

            return this.pendingAnnotation.shape && this.pendingAnnotation.frames.length > 0 && this.pendingAnnotation.points.length > 0;
        },
        cantFinishDrawAnnotation() {
            return !this.hasPendingAnnotation;
        },
        cantFinishTrackAnnotation() {
            return !this.pendingAnnotation.frames || this.pendingAnnotation.frames.length !== 1;
        },

        singleAnnotationActive() {
            return settings.get('singleAnnotation');
        },
    },
    methods: {
        requireSelectedLabel() {
            this.$emit('requires-selected-label');
            this.resetInteractionMode();
        },
        initPendingAnnotationLayer(map) {
            this.pendingAnnotationSource = new VectorSource();
            this.pendingAnnotationLayer = new VectorLayer({
                opacity: 0.5,
                source: this.pendingAnnotationSource,
                updateWhileAnimating: true,
                updateWhileInteracting: true,
                style: Styles.editing,
            });

            map.addLayer(this.pendingAnnotationLayer);
        },
        draw(name) {
            if (this['isDrawing' + name]) {
                this.resetInteractionMode();
            } else if (this.hasNoSelectedLabel) {
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
        drawWholeFrame() {
            this.draw('WholeFrame');
        },
        maybeUpdateDrawInteractionMode(mode) {
            let shape = mode.slice(4); // Remove the 'draw' prefix.
            this.resetPendingAnnotation(shape);

            if (this.drawInteraction) {
                this.map.removeInteraction(this.drawInteraction);
                this.drawInteraction = undefined;
            }

            if (this.isDrawing && this.hasSelectedLabel) {
                this.pause();

                if (this.isDrawingWholeFrame) {
                    this.pendingAnnotation.frames.push(this.video.currentTime);
                    this.$emit('pending-annotation', this.pendingAnnotation);
                } else {
                    this.drawInteraction = new DrawInteraction({
                        source: this.pendingAnnotationSource,
                        type: shape,
                        style: Styles.editing,
                        condition: this.updateSnapCoords
                    });

                    this.map.addInteraction(this.drawInteraction);

                    this.drawInteraction.on('drawstart', () => {
                        this.drawEnded = false;
                    });
                    this.drawInteraction.on('drawend', (e) => {
                        this.extendPendingAnnotation(e);
                        this.drawEnded = true;
                    });
                    this.drawInteraction.on('drawabort', () => {
                        this.drawEnded = true;
                    });
                }
            }
        },
        finishDrawAnnotation() {
            if (this.isDrawing || this.isUsingPolygonBrush) {
                if (this.hasPendingAnnotation) {
                    if (this.isDrawingWholeFrame && !this.pendingAnnotation.frames.includes(this.video.currentTime)) {
                        this.pendingAnnotation.frames.push(this.video.currentTime);
                    }
                    this.$emit('create-annotation', this.pendingAnnotation);

                    if (this.isDrawingWholeFrame) {
                        this.resetInteractionMode();
                    } else {
                        this.resetPendingAnnotation(this.pendingAnnotation.shape);
                    }
                }
            }
        },
        finishTrackAnnotation() {
            if (this.isDrawing) {
                if (this.hasPendingAnnotation) {
                    this.$emit('track-annotation', this.pendingAnnotation);
                    this.resetPendingAnnotation(this.pendingAnnotation.shape);
                }
            }
        },
        resetPendingAnnotation(shape) {
            this.pendingAnnotationSource.clear();
            this.pendingAnnotation = {
                shape: shape,
                frames: [],
                points: [],
            };
            this.$emit('pending-annotation', null);
        },
        extendPendingAnnotation(e) {
            if (isInvalidShape(e.feature)) {
                // Disallow shapes with too few points.
                this.$emit('is-invalid-shape', e.feature.getGeometry().getType());
                // Wait for this feature to be added to the source, then remove it.
                this.pendingAnnotationSource.once('addfeature', () => {
                    this.pendingAnnotationSource.removeFeature(e.feature);
                });
                return;
            }

            // Check polygons
            if (e.feature.getGeometry().getType() === 'Polygon') {
                // If polygon is self-intersecting, create simple polygon
                simplifyPolygon(e.feature);
            }

            let lastFrame = this.pendingAnnotation.frames[this.pendingAnnotation.frames.length - 1];

            if (lastFrame === undefined || lastFrame < this.video.currentTime) {
                if (this.singleAnnotationActive && this.isPointDoubleClick(e)) { 
                    this.pendingAnnotationSource.once('addfeature', function (e) {
                        this.removeFeature(e.feature);
                    });
                }
                else {
                    this.pendingAnnotation.frames.push(this.video.currentTime);
                    this.pendingAnnotation.points.push(this.getPointsFromGeometry(e.feature.getGeometry()));

                    if (!this.video.ended && this.autoplayDraw > 0) {
                        this.play();
                        window.clearTimeout(this.autoplayDrawTimeout);
                        this.autoplayDrawTimeout = window.setTimeout(this.pause, this.autoplayDraw * 1000);
                    }
                }

            } else {
                // If the pending annotation (time) is invalid, remove it again.
                // We have to wait for this feature to be added to the source to be able
                // to remove it.
                this.pendingAnnotationSource.once('addfeature', function (e) {
                    this.removeFeature(e.feature);
                });
            }

            this.$emit('pending-annotation', this.pendingAnnotation);

            if (this.singleAnnotationActive) {
                if (!this.isDrawingPoint) {
                    this.pendingAnnotationSource.once('addfeature', this.finishDrawAnnotation);
                }
                else {
                    if (this.isPointDoubleClick(e)) {
                        this.resetPendingAnnotation(this.pendingAnnotation.shape);
                        return;
                    }
                    this.lastDrawnPointTime = new Date().getTime();
                    this.lastDrawnPoint = e.feature.getGeometry();
                    this.pendingAnnotationSource.once('addfeature', this.finishDrawAnnotation);
                }
            }
        },

        isPointDoubleClick(e) {
            return new Date().getTime() - this.lastDrawnPointTime < POINT_CLICK_COOLDOWN
                && computeDistance(this.lastDrawnPoint, e.feature.getGeometry()) < POINT_CLICK_DISTANCE;
        },
    },
    created() {
        this.$once('map-ready', this.initPendingAnnotationLayer);

        if (this.canAdd) {
            this.$watch('interactionMode', this.maybeUpdateDrawInteractionMode);
            Keyboard.on('a', this.drawPoint, 0, this.listenerSet);
            Keyboard.on('s', this.drawRectangle, 0, this.listenerSet);
            Keyboard.on('d', this.drawCircle, 0, this.listenerSet);
            Keyboard.on('f', this.drawLineString, 0, this.listenerSet);
            Keyboard.on('g', this.drawPolygon, 0, this.listenerSet);
            Keyboard.on('h', this.drawWholeFrame, 0, this.listenerSet);
            Keyboard.on('Enter', this.finishDrawAnnotation, 0, this.listenerSet);
        }
    },
};
</script>
