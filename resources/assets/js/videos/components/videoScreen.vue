<template>
    <div class="video-screen" :style="styleObject">
        <minimap
            v-if="showMinimap && !hasError"
            :extent="extent"
            ></minimap>
        <label-tooltip
            :features="hoveredFeatures"
            :show="showLabelTooltip"
            :position="mousePosition"
            ></label-tooltip>
        <div class="controls">
            <div v-if="showPrevNext" class="btn-group">
                <control-button
                    icon="fa-step-backward"
                    :title="enableJumpByFrame ? 'Previous video 𝗦𝗵𝗶𝗳𝘁+𝗟𝗲𝗳𝘁 𝗮𝗿𝗿𝗼𝘄' : 'Previous video 𝗟𝗲𝗳𝘁 𝗮𝗿𝗿𝗼𝘄'"
                    @click="emitPrevious"
                    ></control-button>
                <control-button
                    icon="fa-step-forward"
                    :title="enableJumpByFrame ? 'Next video 𝗦𝗵𝗶𝗳𝘁+𝗥𝗶𝗴𝗵𝘁 𝗮𝗿𝗿𝗼𝘄' : 'Next video 𝗥𝗶𝗴𝗵𝘁 𝗮𝗿𝗿𝗼𝘄'"
                    @click="emitNext"
                    ></control-button>
            </div>
            <div class="btn-group">
                <control-button
                    v-if="jumpStep!=0"
                    :disabled="seeking || null"
                    icon="fa-backward"
                    :title="jumpBackwardMessage"
                    @click="jumpBackward"
                    ></control-button>
                <control-button
                    v-if="enableJumpByFrame"
                    :disabled="seeking || null"
                    icon="fa-caret-square-left"
                    title="Previous frame 𝗟𝗲𝗳𝘁 𝗮𝗿𝗿𝗼𝘄"
                    v-on:click="emitPreviousFrame"
                    ></control-button>
                <control-button
                    v-if="playing"
                    icon="fa-pause"
                    title="Pause 𝗦𝗽𝗮𝗰𝗲𝗯𝗮𝗿"
                    :disabled="hasError || null"
                    @click="pause"
                    ></control-button>
                <control-button
                    v-else
                    icon="fa-play"
                    title="Play 𝗦𝗽𝗮𝗰𝗲𝗯𝗮𝗿"
                    :disabled="hasError || null"
                    @click="play"
                    ></control-button>
                <control-button
                    v-if="enableJumpByFrame"
                    :disabled="seeking || null"
                    icon="fa-caret-square-right"
                    title="Next frame 𝗥𝗶𝗴𝗵𝘁 𝗮𝗿𝗿𝗼𝘄"
                    v-on:click="emitNextFrame"
                    ></control-button>
                <control-button
                    v-if="jumpStep!=0"
                    :disabled="seeking || null"
                    icon="fa-forward"
                    :title="jumpForwardMessage"
                    @click="jumpForward"
                    ></control-button>
            </div>
            <div v-if="canAdd" class="btn-group">
                <control-button
                    icon="icon-point"
                    :title="(singleAnnotation ? 'Set a point'  : 'Start a point annotation') + ' 𝗔'"
                    :hover="false"
                    :open="isDrawingPoint"
                    :active="isDrawingPoint"
                    :disabled="hasError || null"
                    @click="drawPoint"
                    v-slot="{onActive}"
                    >
                        <control-button
                            v-if="singleAnnotation"
                            icon="fa-check"
                            title="Disable the single-frame annotation option to create multi-frame annotations"
                            :disabled="true"
                            ></control-button> 
                        <control-button
                            v-else
                            icon="fa-check"
                            title="Finish the point annotation 𝗘𝗻𝘁𝗲𝗿"
                            :disabled="cantFinishDrawAnnotation || null"
                            @click="finishDrawAnnotation"
                            @active="onActive"
                            ></control-button>
                        <control-button
                            v-if="singleAnnotation"
                            icon="fa-project-diagram"
                            title="Disable the single-frame annotation option to track annotations"
                            :disabled="true"
                            ></control-button> 
                        <control-button
                            v-else
                            icon="fa-project-diagram"
                            title="Finish and track the point annotation"
                            :disabled="(cantFinishTrackAnnotation || disableJobTracking) || null"
                            :loading="disableJobTracking"
                            @click="finishTrackAnnotation"
                            @active="onActive"
                            ></control-button>
                </control-button>
                <control-button
                    icon="icon-rectangle"
                    :title="(singleAnnotation ? 'Draw a rectangle' : 'Start a rectangle annotation') + ' 𝗦'"
                    :hover="false"
                    :open="isDrawingRectangle"
                    :active="isDrawingRectangle"
                    :disabled="hasError || null"
                    @click="drawRectangle"
                    v-slot="{onActive}"
                    >
                        <control-button
                        v-if="singleAnnotation"
                            icon="fa-check"
                            title="Disable the single-frame annotation option to create multi-frame annotations"
                            :disabled="true"
                            ></control-button>    
                        <control-button
                            v-else
                            icon="fa-check"
                            title="Finish the rectangle annotation 𝗘𝗻𝘁𝗲𝗿"
                            :disabled="cantFinishDrawAnnotation || null"
                            @click="finishDrawAnnotation"
                            @active="onActive"
                            ></control-button>
                </control-button>
                <control-button
                    icon="icon-circle"
                    :title="(singleAnnotation ? 'Draw a circle' : 'Start a circle annotation') + ' 𝗗'"
                    :hover="false"
                    :open="isDrawingCircle"
                    :active="isDrawingCircle"
                    :disabled="hasError || null"
                    @click="drawCircle"
                    v-slot="{onActive}"
                    >
                        <control-button
                            v-if="singleAnnotation"
                            icon="fa-check"
                            title="Disable the single-frame annotation option to create multi-frame annotations"
                            :disabled="true"
                            ></control-button>
                        <control-button
                            v-else
                            icon="fa-check"
                            title="Finish the circle annotation 𝗘𝗻𝘁𝗲𝗿"
                            :disabled="cantFinishDrawAnnotation || null"
                            @click="finishDrawAnnotation"
                            @active="onActive"
                            ></control-button>
                        <control-button
                            v-if="singleAnnotation"
                            icon="fa-project-diagram"
                            title="Disable the single-frame annotation option to track annotations"
                            :disabled="true"
                            ></control-button> 
                        <control-button
                            v-else
                            icon="fa-project-diagram"
                            title="Finish and track the circle annotation"
                            :disabled="(cantFinishTrackAnnotation || disableJobTracking) || null"
                            :loading="disableJobTracking"
                            @click="finishTrackAnnotation"
                            @active="onActive"
                            ></control-button>
                </control-button>
                <control-button
                    icon="icon-linestring"
                    :title="(singleAnnotation ? 'Draw a line string' : 'Start a line annotation') + ' 𝗙'"
                    :hover="false"
                    :open="isDrawingLineString"
                    :active="isDrawingLineString"
                    :disabled="hasError || null"
                    @click="drawLineString"
                    v-slot="{onActive}"
                    >
                        <control-button
                            v-if="singleAnnotation"
                            icon="fa-check"
                            title="Disable the single-frame annotation option to create multi-frame annotations"
                            :disabled="true"
                            ></control-button>     
                        <control-button
                            v-else
                            icon="fa-check"
                            title="Finish the line annotation 𝗘𝗻𝘁𝗲𝗿"
                            :disabled="cantFinishDrawAnnotation || null"
                            @click="finishDrawAnnotation"
                            @active="onActive"
                            ></control-button>
                </control-button>
                <control-button
                    icon="icon-polygon"
                    :title="(singleAnnotation ? 'Draw a polygon' : 'Start a polygon annotation') + ' 𝗚'"
                    :open="isDrawingPolygon"
                    :active="isDrawingPolygon"
                    :disabled="hasError || null"
                    @click="drawPolygon"
                    v-slot="{onActive}"
                    >
                        <control-button
                            v-if="(isDrawingPolygon || isUsingPolygonBrush) && singleAnnotation"
                            icon="fa-check"
                            title="Disable the single-frame annotation option to create multi-frame annotations"
                            :disabled="true"
                            ></control-button>     
                        <control-button
                            v-else-if="isDrawingPolygon || isUsingPolygonBrush"
                            icon="fa-check"
                            title="Finish the polygon annotation 𝗘𝗻𝘁𝗲𝗿"
                            :disabled="cantFinishDrawAnnotation || null"
                            @click="finishDrawAnnotation"
                            @active="onActive"
                            ></control-button>
                        <control-button
                            icon="fa-paint-brush"
                            title="Draw a polygon using the brush tool 𝗘"
                            :active="isUsingPolygonBrush"
                            @click="togglePolygonBrush"
                            @active="onActive"
                            ></control-button>
                        <control-button
                            icon="fa-eraser"
                            title="Modify selected polygons using the eraser tool 𝗥"
                            :active="isUsingPolygonEraser"
                            @click="togglePolygonEraser"
                            @active="onActive"
                            ></control-button>
                        <control-button
                            icon="fa-fill-drip"
                            title="Modify selected polygons using the fill tool 𝗧"
                            :active="isUsingPolygonFill"
                            @click="togglePolygonFill"
                            @active="onActive"
                            ></control-button>
                </control-button>
                <control-button
                    icon="icon-wholeframe"
                    :title="(singleAnnotation ? 'Create a whole frame annotation' : 'Start a whole frame annotation') + ' 𝗛'"
                    :hover="false"
                    :open="isDrawingWholeFrame"
                    :active="isDrawingWholeFrame"
                    :disabled="hasError || null"
                    @click="drawWholeFrame"
                    v-slot="{onActive}"
                    >
                        <control-button
                            v-if="singleAnnotation"
                            icon="fa-check"
                            title="Disable the single-frame annotation option to create multi-frame annotations"
                            :disabled="true"
                            ></control-button>     
                        <control-button
                            v-else
                            icon="fa-check"
                            title="Finish the whole frame annotation 𝗘𝗻𝘁𝗲𝗿"
                            :disabled="cantFinishDrawAnnotation || null"
                            @click="finishDrawAnnotation"
                            @active="onActive"
                            ></control-button>
                </control-button>
            </div>
            <div v-if="showModifyBar" class="btn-group">
                <control-button
                    v-if="canModify"
                    icon="fa-tag"
                    title="Attach the currently selected label to existing annotations 𝗟"
                    :active="isAttaching"
                    :disabled="(hasNoSelectedLabel || hasError) || null"
                    @click="toggleAttaching"
                    v-slot="{onActive}"
                    >
                        <control-button
                            icon="fa-sync-alt"
                            title="Swap the most recent label of an existing annotation with the currently selected one 𝗦𝗵𝗶𝗳𝘁+𝗟"
                            :active="isSwapping"
                            :disabled="(hasNoSelectedLabel || hasError) || null"
                            @click="toggleSwapping"
                            @active="onActive"
                            ></control-button>
                    </control-button>
                <control-button
                    v-if="canModify"
                    icon="fa-arrows-alt"
                    title="Move selected annotations 𝗠"
                    :active="isTranslating"
                    :disabled="hasError || null"
                    @click="toggleTranslating"
                    ></control-button>
                <control-button
                    v-if="canModify"
                    icon="fa-link"
                    title="Link selected annotations"
                    :disabled="(cannotLinkAnnotations || hasError) || null"
                    @click="emitLinkAnnotations"
                    ></control-button>
                <control-button
                    v-if="canModify"
                    icon="fa-unlink"
                    title="Split selected annotation"
                    :disabled="(cannotSplitAnnotation || hasError) || null"
                    @click="emitSplitAnnotation"
                    ></control-button>
                <control-button
                    v-if="canDelete"
                    icon="fa-trash"
                    title="Delete selected annotations/keyframes 𝗗𝗲𝗹𝗲𝘁𝗲"
                    :disabled="(hasNoSelectedAnnotations || hasError) || null"
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
import AnnotationArray from '../models/AnnotationArray.js';
import AnnotationPlayback from './videoScreen/annotationPlayback.vue';
import Collection from '@biigle/ol/Collection';
import ControlButton from '@/annotations/components/controlButton.vue';
import DrawInteractions from './videoScreen/drawInteractions.vue';
import Indicators from './videoScreen/indicators.vue';
import Keyboard from '@/core/keyboard.js';
import Map from '@biigle/ol/Map';
import Minimap from '@/annotations/components/minimap.vue';
import ModifyInteractions from './videoScreen/modifyInteractions.vue';
import PolygonBrushInteractions from './videoScreen/polygonBrushInteractions.vue';
import SelectInteraction from '@biigle/ol/interaction/Select';
import Styles from '@/annotations/stores/styles.js';
import Tooltips from './videoScreen/tooltips.vue';
import VectorLayer from '@biigle/ol/layer/Vector';
import VectorSource from '@biigle/ol/source/Vector';
import VideoPlayback from './videoScreen/videoPlayback.vue';
import ZoomControl from '@biigle/ol/control/Zoom';
import ZoomToExtentControl from '@biigle/ol/control/ZoomToExtent';
import ZoomToNativeControl from '@/annotations/ol/ZoomToNativeControl.js';
import PopoutControl from '../ol/PopoutControl.js';
import {click as clickCondition} from '@biigle/ol/events/condition';
import {containsCoordinate} from '@biigle/ol/extent';
import {defaults as defaultInteractions} from '@biigle/ol/interaction';
import {markRaw} from 'vue';

export default {
    emits: [
        'moveend',
        'next',
        'previous',
        'select',
        'track',
        'popout',
    ],
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
            required: true,
            validator(value) {
                // In case of a popup window, the video may be a AnnotationArray of a
                // different context which would fail a simple "type: AnnotationArray"
                // check. We do the type check here and have a fallback based on the
                // constructor name for the popup.
                return value instanceof AnnotationArray || value.constructor.name === 'AnnotationArray';
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
        jumpStep: {
            type: Number,
            default: 5.0,
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
        singleAnnotation: {
            type: Boolean,
            default: false,
        },
        showMousePosition: {
            type: Boolean,
            default: true,
        },
        video: {
            required: true,
            validator(value) {
                // In case of a popup window, the video may be a HTMLVideoElement of a
                // different context which would fail a simple "type: HTMLVideoElement"
                // check. We do the type check here and have a fallback based on the
                // constructor name for the popup.
                return value instanceof HTMLVideoElement || value.constructor.name === 'HTMLVideoElement';
            },
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
        reachedTrackedAnnotationLimit: {
            type: Boolean,
            default: false,
        },
        enableJumpByFrame: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            interactionMode: 'default',
            // Mouse position in OpenLayers coordinates.
            mousePosition: [0, 0],
            mapReadyRevision: 0,
            map: null,
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
        disableJobTracking() {
            return this.reachedTrackedAnnotationLimit;
        },
        jumpBackwardMessage() {
            return `Rewind video by ${this.jumpStep} s 𝗖𝘁𝗿𝗹+𝗟𝗲𝗳𝘁 𝗮𝗿𝗿𝗼𝘄`;
        },
        jumpForwardMessage() {
            return `Advance video by ${this.jumpStep} s 𝗖𝘁𝗿𝗹+𝗥𝗶𝗴𝗵𝘁 𝗮𝗿𝗿𝗼𝘄`;
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

            control =  new PopoutControl();
            control.on('click', this.handlePopout);
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
        handleFeatureSelect(e) {
            let selected = this.selectInteraction.getFeatures()
                .getArray()
                .map(this.extractAnnotationFromFeature);

            let deselected;

            if (e.mapBrowserEvent.originalEvent.shiftKey) {
                deselected = e.deselected.map(this.extractAnnotationFromFeature);
            } else {
                // This must also include annotations from different frames.
                // See: https://github.com/biigle/core/issues/552.
                deselected = this.annotations
                    .filter(a => a.isSelected)
                    .filter(a => !selected.includes(a));
            }

            this.$emit('select', selected, deselected, this.video.currentTime);
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
        adaptKeyboardShortcuts() {
            if(this.enableJumpByFrame) {
                Keyboard.off('ArrowRight', this.emitNext, 0, this.listenerSet);
                Keyboard.off('ArrowLeft', this.emitPrevious, 0, this.listenerSet);
                Keyboard.on('Shift+ArrowRight', this.emitNext, 0, this.listenerSet);
                Keyboard.on('Shift+ArrowLeft', this.emitPrevious, 0, this.listenerSet);
                Keyboard.on('ArrowRight', this.emitNextFrame, 0, this.listenerSet);
                Keyboard.on('ArrowLeft', this.emitPreviousFrame, 0, this.listenerSet);
            }
            else {
                Keyboard.off('Shift+ArrowRight', this.emitNext, 0, this.listenerSet);
                Keyboard.off('Shift+ArrowLeft', this.emitPrevious, 0, this.listenerSet);
                Keyboard.off('ArrowRight', this.emitNextFrame, 0, this.listenerSet);
                Keyboard.off('ArrowLeft', this.emitPreviousFrame, 0, this.listenerSet);
                Keyboard.on('ArrowRight', this.emitNext, 0, this.listenerSet);
                Keyboard.on('ArrowLeft', this.emitPrevious, 0, this.listenerSet);
            }
        },
        handlePopout() {
            this.$emit('popout');
        },
    },
    watch: {
        selectedAnnotations: {
            deep: true,
            handler(annotations) {
                // This allows selection of annotations outside OpenLayers and forwards
                // the state to the SelectInteraction.
                let source = this.annotationSource;
                let features = this.selectedFeatures;
                if (!source || !features) {
                    return;
                }

                let featureIdMap = {};
                let annotationIdMap = {};
                annotations.forEach(a => annotationIdMap[a.id] = true);
                let toRemove = [];

                features.forEach(f => {
                    const id = f.getId();
                    if (annotationIdMap[id]) {
                        featureIdMap[id] = true;
                    } else {
                        toRemove.push(f);
                    }
                });

                if (toRemove.length === features.getLength()) {
                    features.clear();
                } else {
                    toRemove.forEach(f => features.remove(f));
                }

                annotations
                    .filter(a => !featureIdMap[a.id])
                    .map(a => source.getFeatureById(a.id))
                    // Ignore a==null because the selected annotation may not exist in the
                    // current video frame.
                    .forEach(a => a && features.push(a));
            },
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
        enableJumpByFrame() {
            this.adaptKeyboardShortcuts();
        },
        mapReadyRevision: {
            once: true,
            handler() {
                this.initLayersAndInteractions(this.map);
                this.initInitialCenterAndResolution(this.map);
            },
        },
    },
    created() {
        // markRaw is essential here!
        this.map = markRaw(this.createMap());
        this.map.on('pointermove', this.updateMousePosition);
        this.map.on('moveend', this.emitMoveend);

        this.adaptKeyboardShortcuts();
        Keyboard.on('Escape', this.resetInteractionMode, 0, this.listenerSet);
        Keyboard.on('Control+ArrowRight', this.jumpForward, 0, this.listenerSet);
        Keyboard.on('Control+ArrowLeft', this.jumpBackward, 0, this.listenerSet);
    },
    mounted() {
        this.map.setTarget(this.$el);
    },
};
</script>
