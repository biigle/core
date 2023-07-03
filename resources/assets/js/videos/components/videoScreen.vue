<template>
    <div class="video-screen" :style="styleObject">
        <minimap
            v-if="showMinimap && !hasError"
            :extent="extent"
            :render-active="!seeking"
            ></minimap>
        <label-tooltip
            watch="hoverFeatures"
            :show="showLabelTooltip"
            :position="mousePosition"
            ></label-tooltip>
        <div class="controls">
            <div class="btn-group">
                 <control-button
                    v-if="showPrevNext"
                    icon="fa-step-backward"
                    title="Previous video 𝗟𝗲𝗳𝘁 𝗮𝗿𝗿𝗼𝘄"
                    @click="emitPrevious"
                    ></control-button>
                <control-button
                    v-if="playing"
                    icon="fa-pause"
                    title="Pause 𝗦𝗽𝗮𝗰𝗲𝗯𝗮𝗿"
                    :disabled="hasError"
                    @click="pause"
                    ></control-button>
                <control-button
                    v-else
                    icon="fa-play"
                    title="Play 𝗦𝗽𝗮𝗰𝗲𝗯𝗮𝗿"
                    :disabled="hasError"
                    @click="play"
                    ></control-button>
                <control-button
                    v-if="showPrevNext"
                    icon="fa-step-forward"
                    title="Next video 𝗥𝗶𝗴𝗵𝘁 𝗮𝗿𝗿𝗼𝘄"
                    @click="emitNext"
                    ></control-button>
            </div>
            <div v-if="canAdd" class="btn-group">
                <control-button
                    icon="icon-point"
                    title="Start a point annotation 𝗔"
                    :hover="false"
                    :open="isDrawingPoint"
                    :active="isDrawingPoint"
                    :disabled="hasError"
                    @click="drawPoint"
                    >
                        <control-button
                            icon="fa-check"
                            title="Finish the point annotation 𝗘𝗻𝘁𝗲𝗿"
                            :disabled="cantFinishDrawAnnotation"
                            @click="finishDrawAnnotation"
                            ></control-button>
                        <control-button
                            icon="fa-project-diagram"
                            title="Finish and track the point annotation"
                            v-on:click="finishTrackAnnotation"
                            :disabled="cantFinishTrackAnnotation"
                            ></control-button>
                </control-button>
                <control-button
                    icon="icon-rectangle"
                    title="Start a rectangle annotation 𝗦"
                    :hover="false"
                    :open="isDrawingRectangle"
                    :active="isDrawingRectangle"
                    :disabled="hasError"
                    @click="drawRectangle"
                    >
                        <control-button
                            icon="fa-check"
                            title="Finish the rectangle annotation 𝗘𝗻𝘁𝗲𝗿"
                            :disabled="cantFinishDrawAnnotation"
                            @click="finishDrawAnnotation"
                            ></control-button>
                </control-button>
                <control-button
                    icon="icon-circle"
                    title="Start a circle annotation 𝗗"
                    :hover="false"
                    :open="isDrawingCircle"
                    :active="isDrawingCircle"
                    :disabled="hasError"
                    @click="drawCircle"
                    >
                        <control-button
                            icon="fa-check"
                            title="Finish the circle annotation 𝗘𝗻𝘁𝗲𝗿"
                            :disabled="cantFinishDrawAnnotation"
                            @click="finishDrawAnnotation"
                            ></control-button>
                        <control-button
                            icon="fa-project-diagram"
                            title="Finish and track the circle annotation"
                            v-on:click="finishTrackAnnotation"
                            :disabled="cantFinishTrackAnnotation"
                            ></control-button>
                </control-button>
                <control-button
                    icon="icon-linestring"
                    title="Start a line annotation 𝗙"
                    :hover="false"
                    :open="isDrawingLineString"
                    :active="isDrawingLineString"
                    :disabled="hasError"
                    @click="drawLineString"
                    >
                        <control-button
                            icon="fa-check"
                            title="Finish the line annotation 𝗘𝗻𝘁𝗲𝗿"
                            :disabled="cantFinishDrawAnnotation"
                            @click="finishDrawAnnotation"
                            ></control-button>
                </control-button>
                <control-button
                    icon="icon-polygon"
                    title="Start a polygon annotation 𝗚"
                    :open="isDrawingPolygon"
                    :active="isDrawingPolygon"
                    :disabled="hasError"
                    @click="drawPolygon"
                    >
                        <control-button
                            v-if="isDrawingPolygon || isUsingPolygonBrush"
                            icon="fa-check"
                            title="Finish the polygon annotation 𝗘𝗻𝘁𝗲𝗿"
                            :disabled="cantFinishDrawAnnotation"
                            @click="finishDrawAnnotation"
                            ></control-button>
                        <control-button
                            icon="fa-paint-brush"
                            title="Draw a polygon using the brush tool 𝗘"
                            :active="isUsingPolygonBrush"
                            @click="togglePolygonBrush"
                            ></control-button>
                        <control-button
                            icon="fa-eraser"
                            title="Modify selected polygons using the eraser tool 𝗥"
                            :active="isUsingPolygonEraser"
                            @click="togglePolygonEraser"
                            ></control-button>
                        <control-button
                            icon="fa-fill-drip"
                            title="Modify selected polygons using the fill tool 𝗧"
                            :active="isUsingPolygonFill"
                            @click="togglePolygonFill"
                            ></control-button>
                </control-button>
                <control-button
                    icon="icon-wholeframe"
                    title="Start a whole frame annotation 𝗛"
                    :hover="false"
                    :open="isDrawingWholeFrame"
                    :active="isDrawingWholeFrame"
                    :disabled="hasError"
                    @click="drawWholeFrame"
                    >
                        <control-button
                            icon="fa-check"
                            title="Finish the whole frame annotation 𝗘𝗻𝘁𝗲𝗿"
                            :disabled="cantFinishDrawAnnotation"
                            @click="finishDrawAnnotation"
                            ></control-button>
                </control-button>
            </div>
            <div v-if="showModifyBar" class="btn-group">
                <control-button
                    v-if="canModify"
                    icon="fa-tag"
                    title="Attach the currently selected label to existing annotations 𝗟"
                    :active="isAttaching"
                    :disabled="hasNoSelectedLabel || hasError"
                    @click="toggleAttaching"
                    >
                        <control-button
                            icon="fa-sync-alt"
                            title="Swap the most recent label of an existing annotation with the currently selected one 𝗦𝗵𝗶𝗳𝘁+𝗟"
                            :active="isSwapping"
                            :disabled="hasNoSelectedLabel || hasError"
                            @click="toggleSwapping"
                            ></control-button>
                    </control-button>
                <control-button
                    v-if="canModify"
                    icon="fa-arrows-alt"
                    title="Move selected annotations 𝗠"
                    :active="isTranslating"
                    :disabled="hasError"
                    @click="toggleTranslating"
                    ></control-button>
                <control-button
                    v-if="canModify"
                    icon="fa-link"
                    title="Link selected annotations"
                    :disabled="cannotLinkAnnotations || hasError"
                    @click="emitLinkAnnotations"
                    ></control-button>
                <control-button
                    v-if="canModify"
                    icon="fa-unlink"
                    title="Split selected annotation"
                    :disabled="cannotSplitAnnotation || hasError"
                    @click="emitSplitAnnotation"
                    ></control-button>
                <control-button
                    v-if="canDelete"
                    icon="fa-trash"
                    title="Delete selected annotations/keyframes 𝗗𝗲𝗹𝗲𝘁𝗲"
                    :disabled="hasNoSelectedAnnotations || hasError"
                    @click="emitDelete"
                    ></control-button>
            </div>
        </div>
        <div class="indicators indicators--left">
            <mouse-position-indicator
                v-if="showMousePosition"
                :position="mousePositionImageCoordinates"
                ></mouse-position-indicator>
        </div>
        <div class="indicators indicators--right">
            <div
                class="indicator"
                v-if="selectedLabel"
                v-text="selectedLabel.name"
                ></div>
        </div>
    </div>
</template>

<script>
import AnnotationPlayback from './videoScreen/annotationPlayback';
import Collection from '@biigle/ol/Collection';
import ControlButton from '../../annotations/components/controlButton';
import DrawInteractions from './videoScreen/drawInteractions';
import Indicators from './videoScreen/indicators';
import Keyboard from '../../core/keyboard';
import {CancelableMap as Map} from '../../annotations/ol/CancelableMap';
import Minimap from '../../annotations/components/minimap';
import ModifyInteractions from './videoScreen/modifyInteractions';
import PolygonBrushInteractions from './videoScreen/polygonBrushInteractions';
import SelectInteraction from '@biigle/ol/interaction/Select';
import Styles from '../../annotations/stores/styles';
import Tooltips from './videoScreen/tooltips';
import VectorLayer from '@biigle/ol/layer/Vector';
import VectorSource from '@biigle/ol/source/Vector';
import VideoPlayback from './videoScreen/videoPlayback';
import ZoomControl from '@biigle/ol/control/Zoom';
import ZoomToExtentControl from '@biigle/ol/control/ZoomToExtent';
import ZoomToNativeControl from '../../annotations/ol/ZoomToNativeControl';
import {click as clickCondition} from '@biigle/ol/events/condition';
import {containsCoordinate} from '@biigle/ol/extent';
import {defaults as defaultInteractions} from '@biigle/ol/interaction';

export default {
    mixins: [
        VideoPlayback,
        AnnotationPlayback,
        DrawInteractions,
        ModifyInteractions,
        Tooltips,
        Indicators,
        PolygonBrushInteractions,
    ],
    components: {
        controlButton: ControlButton,
        minimap: Minimap,
    },
    props: {
        annotations: {
            type: Array,
            default() {
                return [];
            },
        },
        annotationOpacity: {
            type: Number,
            default: 1.0,
        },
        autoplayDraw: {
            type: Number,
            default: 0,
        },
        canAdd: {
            type: Boolean,
            default: false,
        },
        canModify: {
            type: Boolean,
            default: false,
        },
        canDelete: {
            type: Boolean,
            default: false,
        },
        initialCenter: {
            type: Array,
            default() {
                return [0, 0];
            },
        },
        initialResolution: {
            type: Number,
            default: 0,
        },
        listenerSet: {
            type: String,
            default: 'default',
        },
        selectedAnnotations: {
            type: Array,
            default() {
                return [];
            },
        },
        selectedLabel: {
            type: Object,
        },
        showLabelTooltip: {
            type: Boolean,
            default: false,
        },
        showMinimap: {
            type: Boolean,
            default: true,
        },
        showMousePosition: {
            type: Boolean,
            default: true,
        },
        video: {
            type: HTMLVideoElement,
            required: true,
        },
        heightOffset: {
            type: Number,
            default: 0,
        },
        showPrevNext: {
            type: Boolean,
            default: true,
        },
        hasError: {
            type: Boolean,
            default: false,
        },
        seeking: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            interactionMode: 'default',
            // Mouse position in OpenLayers coordinates.
            mousePosition: [0, 0],
        };
    },
    computed: {
        showModifyBar() {
            return this.canModify || this.canDelete;
        },
        hasSelectedAnnotations() {
            return this.selectedAnnotations.length > 0;
        },
        hasNoSelectedAnnotations() {
            return !this.hasSelectedAnnotations;
        },
        isDefaultInteractionMode() {
            return this.interactionMode === 'default';
        },
        styleObject() {
            if (this.heightOffset !== 0) {
                return `height: calc(65% + ${this.heightOffset}px);`;
            }

            return '';
        },
    },
    methods: {
        createMap() {
            let control = new ZoomToExtentControl({
                tipLabel: 'Zoom to show whole video',
                // fontawesome compress icon
                label: '\uf066'
            });

            Keyboard.on('-', control.handleZoomToExtent.bind(control), 0, this.listenerSet);

            let map = new Map({
                controls: [
                    new ZoomControl(),
                    control,
                ],
                interactions: defaultInteractions({
                    altShiftDragRotate: false,
                    doubleClickZoom: false,
                    keyboard: false,
                    shiftDragZoom: false,
                    pinchRotate: false,
                    pinchZoom: true,
                }),
            });

            control = new ZoomToNativeControl({
                // fontawesome expand icon
                label: '\uf065'
            });

            Keyboard.on('+', control.zoomToNative.bind(control), 0, this.listenerSet);

            map.addControl(control);

            return map;
        },
        initLayersAndInteractions(map) {
            this.annotationFeatures = new Collection();

            this.annotationSource = new VectorSource({
                features: this.annotationFeatures,
            });

            this.annotationLayer = new VectorLayer({
                source: this.annotationSource,
                updateWhileAnimating: true,
                updateWhileInteracting: true,
                style: Styles.features,
                opacity: this.annotationOpacity,
                name: 'annotations',
            });

            this.selectInteraction = new SelectInteraction({
                condition: clickCondition,
                style: Styles.highlight,
                layers: [this.annotationLayer],
                multi: true,
            });

            this.selectedFeatures = this.selectInteraction.getFeatures();
            this.selectInteraction.on('select', this.handleFeatureSelect);

            map.addLayer(this.annotationLayer);
            map.addInteraction(this.selectInteraction);
        },

        resetInteractionMode() {
            this.interactionMode = 'default';
        },
        extractAnnotationFromFeature(feature) {
            return feature.get('annotation');
        },
        handleFeatureSelect() {
            // Don't use event.deselected here because it uses selections in current frame only,
            // see https://github.com/biigle/core/issues/552

            // New selected annotations
            let selected = this.selectInteraction.getFeatures().getArray().map(this.extractAnnotationFromFeature);
            // Old selected annotations
            let deselected = this.annotations.filter((a) => {return a.selected;})
                                             .filter((a) => {return !selected.includes(a)});
            this.$emit('select',
                selected,
                deselected,
                this.video.currentTime
            );
        },
        updateMousePosition(e) {
            this.mousePosition = e.coordinate;
        },
        emitTrack() {
            this.$emit('track');
        },
        emitMoveend(e) {
            let view = e.target.getView();
            this.$emit('moveend', view.getCenter(), view.getResolution());
        },
        initInitialCenterAndResolution(map) {
            let view = map.getView();
            if (this.initialResolution !==0) {
                view.setResolution(Math.min(view.getMaxResolution(), Math.max(view.getMinResolution(), this.initialResolution)));
            }

            if ((this.initialCenter[0] !== 0 || this.initialCenter[1] !== 0) && containsCoordinate(this.extent, this.initialCenter)) {
                view.setCenter(this.initialCenter);
            }
        },
        updateSize() {
            this.$nextTick(() => this.map.updateSize());
        },
        emitPrevious() {
            this.$emit('previous');
        },
        emitNext() {
            this.$emit('next');
        },
        reset() {
            this.setPaused();
            this.resetInteractionMode();
        },
    },
    watch: {
        selectedAnnotations(annotations) {
            let source = this.annotationSource;
            let features = this.selectedFeatures;
            if (source && features) {
                let feature;
                features.clear();
                annotations.forEach(function (annotation) {
                    feature = source.getFeatureById(annotation.id);
                    if (feature) {
                        features.push(feature);
                    }
                });
            }
        },
        isDefaultInteractionMode(isDefault) {
            this.selectInteraction.setActive(isDefault);
        },
        annotationOpacity(opactiy) {
            if (this.annotationLayer) {
                this.annotationLayer.setOpacity(opactiy);
            }
        },
        heightOffset() {
            this.updateSize();
        },
    },
    created() {
        this.$once('map-ready', this.initLayersAndInteractions);
        this.$once('map-ready', this.initInitialCenterAndResolution);
        this.map = this.createMap();
        this.$emit('map-created', this.map);
        this.map.on('pointermove', this.updateMousePosition);
        this.map.on('moveend', this.emitMoveend);

        Keyboard.on('Escape', this.resetInteractionMode, 0, this.listenerSet);
        Keyboard.on('ArrowRight', this.emitNext, 0, this.listenerSet);
        Keyboard.on('ArrowLeft', this.emitPrevious, 0, this.listenerSet);
    },
    mounted() {
        this.map.setTarget(this.$el);
    },
};
</script>
