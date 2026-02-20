<script>
import * as preventDoubleclick from '@/prevent-doubleclick';
import DrawInteraction, {createBox} from '@biigle/ol/interaction/Draw';
import Rectangle from '@biigle/ol/geom/Rectangle';
import snapInteraction from "./snapInteraction.vue";
import Styles from '@/annotations/stores/styles.js';
import VectorLayer from '@biigle/ol/layer/Vector';
import VectorSource from '@biigle/ol/source/Vector';
import { isInvalidShape } from '@/annotations/utils.js';
import { never } from '@biigle/ol/events/condition';
import { penTouchXorShift, penTouchOrShift } from '@/annotations/ol/events/condition.js';
import { Point } from '@biigle/ol/geom';
import { simplifyPolygon } from "@/annotations/ol/PolygonValidator";

/**
 * Mixin for the videoScreen component that contains logic for the draw interactions.
 *
 * @type {Object}
 */

export default {
    emits: [
        'create-annotation',
        'is-invalid-shape',
        'pending-annotation',
        'requires-selected-label',
        'track-annotation',
    ],
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
    props: {
        singleAnnotation: {
            type: Boolean,
            default: false
        }
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
        isDrawingAlignedRectangle() {
            return this.interactionMode === 'drawAlignedRectangle';
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
            } else if (this.hasNoSelectedLabel && !this.labelbotIsActive) {
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
        drawAlignedRectangle() {
            this.draw('AlignedRectangle');
        },
        maybeUpdateDrawInteractionMode(mode) {
            let shape = mode.slice(4); // Remove the 'draw' prefix.

            if (this.isDrawingAlignedRectangle) {
                shape = 'Rectangle';
            }

            this.resetPendingAnnotation(shape);

            if (this.drawInteraction) {
                this.map.removeInteraction(this.drawInteraction);
                this.drawInteraction = undefined;
            }

            if (this.isDrawing && (this.hasSelectedLabel || this.labelbotIsActive)) {
                this.pause();

                if (this.isDrawingWholeFrame) {
                    this.pendingAnnotation.frames.push(this.video.currentTime);
                    this.$emit('pending-annotation', this.pendingAnnotation);
                    if (this.singleAnnotation) {
                        this.finishDrawAnnotation();
                    }
                } else {
                    let type = shape;
                    let geometryFunction;

                    if (this.isDrawingAlignedRectangle) {
                        type = 'Circle';
                        geometryFunction = createBox();
                    }

                    this.drawInteraction = new DrawInteraction({
                        source: this.pendingAnnotationSource,
                        type: type,
                        geometryFunction: geometryFunction,
                        style: Styles.editing,
                        freehandCondition: this.getFreehandCondition(mode),
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
        seekToLastFrame(pendingAnnotation) {
            const lastFrame = pendingAnnotation.frames[pendingAnnotation.frames.length - 1];
            if (lastFrame === undefined) {
                return;
            }

            this.$emit('seek', lastFrame);
        },
        finishDrawAnnotation() {
            if (this.isDrawing || this.isUsingPolygonBrush) {
                if (this.hasPendingAnnotation) {
                    if (this.labelbotIsActive) {
                        // If we don't seek to the last frame, no annotation would be
                        // visible as an anchor for the  labelbot popup.
                        this.seekToLastFrame(this.pendingAnnotation);
                    }
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
                screenshotPromise: null,
            };
            this.$emit('pending-annotation', null);
        },
        extendPendingAnnotation(e) {
            if (this.isDrawingAlignedRectangle) {
                let coords = e.feature.getGeometry().getCoordinates();
                // Remove the closing point that createBox adds
                // (Rectangle expects 4 points, not 5).
                coords[0] = coords[0].slice(0, 4);
                e.feature.setGeometry(new Rectangle(coords));
            }

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
            if (lastFrame !== undefined && lastFrame >= this.video.currentTime) {
                // If the pending annotation (time) is invalid, remove it again.
                // We have to wait for this feature to be added to the source to be able
                // to remove it.
                this.pendingAnnotationSource.once('addfeature', function (e) {
                    this.removeFeature(e.feature);
                });
                this.$emit('pending-annotation', this.pendingAnnotation);
                return;
            }

            if (this.singleAnnotation) {
                if (this.isDrawingPoint) {
                    if (this.isPointDoubleClick(e)) {
                        // The feature is added to the source only after this event
                        // is handled, so remove has to happen after the addfeature
                        // event.
                        this.pendingAnnotationSource.once('addfeature', function (e) {
                            this.removeFeature(e.feature);
                        });
                        this.resetPendingAnnotation(this.pendingAnnotation.shape);
                        return;
                    }
                    this.lastDrawnPointTime = new Date().getTime();
                    this.lastDrawnPoint = e.feature.getGeometry();
                }
                this.pendingAnnotationSource.once('addfeature', this.finishDrawAnnotation);
            }

            this.pendingAnnotation.frames.push(this.video.currentTime);
            const points = this.getPointsFromGeometry(e.feature.getGeometry());
            this.pendingAnnotation.points.push(points);

            // The LabelBOT image is always created because the user could decide to
            // enable LabelBOT while they draw the pending annotation.
            if (!this.pendingAnnotation.screenshotPromise) {
                this.pendingAnnotation.screenshotPromise = this.createLabelbotImage(points);
            }

            // Wait for the LabelBOT image before playing the video again.
            if (!this.video.ended && this.autoplayDraw > 0 && this.video.playbackRate > 0) {
                this.pendingAnnotation.screenshotPromise.then(() => {
                    this.play();
                    window.clearTimeout(this.autoplayDrawTimeout);
                    const elapsedVideoTime = (this.autoplayDraw / this.video.playbackRate) * 1000;
                    this.autoplayDrawTimeout = window.setTimeout(this.pause, elapsedVideoTime);
                });
            }

            this.$emit('pending-annotation', this.pendingAnnotation);
        },
        isPointDoubleClick(e) {
            return new Date().getTime() - this.lastDrawnPointTime < preventDoubleclick.POINT_CLICK_COOLDOWN
                && preventDoubleclick.computeDistance(this.lastDrawnPoint, e.feature.getGeometry()) < preventDoubleclick.POINT_CLICK_DISTANCE;
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
        mapReadyRevision: {
            once: true,
            handler() {
                this.initPendingAnnotationLayer(this.map);
            },
        },
    },
    created() {
        if (this.canAdd) {
            this.$watch('interactionMode', this.maybeUpdateDrawInteractionMode);
            this.keyboardOn('a', this.drawPoint, 0, this.listenerSet);
            this.keyboardOn('s', this.drawRectangle, 0, this.listenerSet);
            this.keyboardOn('Shift+s', this.drawAlignedRectangle, 0, this.listenerSet);
            this.keyboardOn('d', this.drawCircle, 0, this.listenerSet);
            this.keyboardOn('f', this.drawLineString, 0, this.listenerSet);
            this.keyboardOn('g', this.drawPolygon, 0, this.listenerSet);
            this.keyboardOn('h', this.drawWholeFrame, 0, this.listenerSet);
            this.keyboardOn('Enter', this.finishDrawAnnotation, 0, this.listenerSet);
            this.keyboardOn('Shift+Enter', this.finishTrackAnnotation, 0, this.listenerSet);
        }
    },
};
</script>
