biigle.$component('videos.components.videoScreen', {
    mixins: [
        biigle.$require('videos.components.videoScreen.videoPlayback'),
        biigle.$require('videos.components.videoScreen.annotationPlayback'),
        biigle.$require('videos.components.videoScreen.drawInteractions'),
        biigle.$require('videos.components.videoScreen.modifyInteractions'),
        biigle.$require('videos.components.videoScreen.tooltips'),
        biigle.$require('videos.components.videoScreen.indicators'),
    ],
    template: '<div class="video-screen">' +
        '<minimap' +
            ' v-if="showMinimap"' +
            ' :extent="extent"' +
            '></minimap>' +
        '<label-tooltip' +
            ' watch="hoverFeatures"' +
            ' :show="showLabelTooltip"' +
            ' :position="mousePosition"' +
            '></label-tooltip>' +
        '<div class="controls">' +
            '<div class="btn-group">' +
                '<control-button' +
                    ' v-if="playing"' +
                    ' icon="fa-pause"' +
                    ' title="Pause 𝗦𝗽𝗮𝗰𝗲𝗯𝗮𝗿"' +
                    ' @click="pause"' +
                    '></control-button>' +
                '<control-button' +
                    ' v-else' +
                    ' icon="fa-play"' +
                    ' title="Play 𝗦𝗽𝗮𝗰𝗲𝗯𝗮𝗿"' +
                    ' @click="play"' +
                    '></control-button>' +
                // '<control-button' +
                //     ' v-if="canAdd"' +
                //     ' icon="fa-bookmark"' +
                //     ' title="Create a bookmark 𝗕"' +
                //     ' @click="emitCreateBookmark"' +
                //     '></control-button>' +
            '</div>' +
            '<div v-if="canAdd" class="btn-group">' +
                '<control-button' +
                    ' icon="icon-point"' +
                    ' title="Start a point annotation 𝗔"' +
                    ' :disabled="hasNoSelectedLabel"' +
                    ' :hover="false"' +
                    ' :open="isDrawingPoint"' +
                    ' :active="isDrawingPoint"' +
                    ' @click="drawPoint"' +
                    '>' +
                        '<control-button' +
                            ' icon="fa-check"' +
                            ' title="Finish the point annotation 𝗘𝗻𝘁𝗲𝗿"' +
                            ' :disabled="cantFinishDrawAnnotation"' +
                            ' @click="finishDrawAnnotation"' +
                            '></control-button>' +
                        '<control-button' +
                            ' icon="fa-project-diagram"' +
                            ' title="Finish and track the point annotation"' +
                            ' v-on:click="finishTrackAnnotation"' +
                            ' :disabled="cantFinishTrackAnnotation"' +
                            '></control-button>' +
                '</control-button>' +
                '<control-button' +
                    ' icon="icon-rectangle"' +
                    ' title="Start a rectangle annotation 𝗦"' +
                    ' :disabled="hasNoSelectedLabel"' +
                    ' :hover="false"' +
                    ' :open="isDrawingRectangle"' +
                    ' :active="isDrawingRectangle"' +
                    ' @click="drawRectangle"' +
                    '>' +
                        '<control-button' +
                            ' icon="fa-check"' +
                            ' title="Finish the rectangle annotation 𝗘𝗻𝘁𝗲𝗿"' +
                            ' :disabled="cantFinishDrawAnnotation"' +
                            ' @click="finishDrawAnnotation"' +
                            '></control-button>' +
                '</control-button>' +
                '<control-button' +
                    ' icon="icon-circle"' +
                    ' title="Start a circle annotation 𝗗"' +
                    ' :disabled="hasNoSelectedLabel"' +
                    ' :hover="false"' +
                    ' :open="isDrawingCircle"' +
                    ' :active="isDrawingCircle"' +
                    ' @click="drawCircle"' +
                    '>' +
                        '<control-button' +
                            ' icon="fa-check"' +
                            ' title="Finish the circle annotation 𝗘𝗻𝘁𝗲𝗿"' +
                            ' :disabled="cantFinishDrawAnnotation"' +
                            ' @click="finishDrawAnnotation"' +
                            '></control-button>' +
                        '<control-button' +
                            ' icon="fa-project-diagram"' +
                            ' title="Finish and track the circle annotation"' +
                            ' v-on:click="finishTrackAnnotation"' +
                            ' :disabled="cantFinishTrackAnnotation"' +
                            '></control-button>' +
                '</control-button>' +
                '<control-button' +
                    ' icon="icon-linestring"' +
                    ' title="Start a line annotation 𝗙"' +
                    ' :disabled="hasNoSelectedLabel"' +
                    ' :hover="false"' +
                    ' :open="isDrawingLineString"' +
                    ' :active="isDrawingLineString"' +
                    ' @click="drawLineString"' +
                    '>' +
                        '<control-button' +
                            ' icon="fa-check"' +
                            ' title="Finish the line annotation 𝗘𝗻𝘁𝗲𝗿"' +
                            ' :disabled="cantFinishDrawAnnotation"' +
                            ' @click="finishDrawAnnotation"' +
                            '></control-button>' +
                '</control-button>' +
                '<control-button' +
                    ' icon="icon-polygon"' +
                    ' title="Start a polygon annotation 𝗚"' +
                    ' :disabled="hasNoSelectedLabel"' +
                    ' :hover="false"' +
                    ' :open="isDrawingPolygon"' +
                    ' :active="isDrawingPolygon"' +
                    ' @click="drawPolygon"' +
                    '>' +
                        '<control-button' +
                            ' icon="fa-check"' +
                            ' title="Finish the polygon annotation 𝗘𝗻𝘁𝗲𝗿"' +
                            ' :disabled="cantFinishDrawAnnotation"' +
                            ' @click="finishDrawAnnotation"' +
                            '></control-button>' +
                '</control-button>' +
            '</div>' +
            '<div v-if="showModifyBar" class="btn-group">' +
                '<control-button' +
                    ' v-if="canModify"' +
                    ' icon="fa-arrows-alt"' +
                    ' title="Move selected annotations 𝗠"' +
                    ' :active="isTranslating"' +
                    ' @click="toggleTranslating"' +
                    '></control-button>' +
                '<control-button' +
                    ' v-if="canModify"' +
                    ' icon="fa-link"' +
                    ' title="Link selected annotations"' +
                    ' :disabled="cannotLinkAnnotations"' +
                    ' @click="emitLinkAnnotations"' +
                    '></control-button>' +
                '<control-button' +
                    ' v-if="canModify"' +
                    ' icon="fa-unlink"' +
                    ' title="Split selected annotation"' +
                    ' :disabled="cannotSplitAnnotation"' +
                    ' @click="emitSplitAnnotation"' +
                    '></control-button>' +
                '<control-button' +
                    ' v-if="canDelete"' +
                    ' icon="fa-trash"' +
                    ' title="Delete selected annotations/keyframes 𝗗𝗲𝗹𝗲𝘁𝗲"' +
                    ' :disabled="hasNoSelectedAnnotations"' +
                    ' @click="emitDelete"' +
                    '></control-button>' +
            '</div>' +
        '</div>' +
        '<div class="indicators indicators--left">' +
            '<mouse-position-indicator' +
                ' v-if="showMousePosition"' +
                ' :position="mousePositionImageCoordinates"' +
                '></mouse-position-indicator>' +
        '</div>' +
        '<div class="indicators indicators--right">' +
            '<div' +
                ' class="indicator"' +
                ' v-if="selectedLabel"' +
                ' v-text="selectedLabel.name"' +
                '></div>' +
        '</div>' +
    '</div>',
    components: {
        controlButton: biigle.$require('annotations.components.controlButton'),
        minimap: biigle.$require('annotations.components.minimap'),
    },
    props: {
        annotations: {
            type: Array,
            default: function () {
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
            default: [0, 0],
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
            default: function () {
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
    },
    data: function () {
        return {
            interactionMode: 'default',
            // Mouse position in OpenLayers coordinates.
            mousePosition: [0, 0],
        };
    },
    computed: {
        showModifyBar: function () {
            return this.canModify || this.canDelete;
        },
        hasSelectedAnnotations: function () {
            return this.selectedAnnotations.length > 0;
        },
        hasNoSelectedAnnotations: function () {
            return !this.hasSelectedAnnotations;
        },
        isDefaultInteractionMode: function () {
            return this.interactionMode === 'default';
        },
    },
    methods: {
        createMap: function () {
            var map = new ol.Map({
                renderer: 'canvas',
                controls: [
                    new ol.control.Zoom(),
                    new ol.control.ZoomToExtent({
                        tipLabel: 'Zoom to show whole video',
                        // fontawesome compress icon
                        label: '\uf066'
                    }),
                ],
                interactions: ol.interaction.defaults({
                    altShiftDragRotate: false,
                    doubleClickZoom: false,
                    keyboard: false,
                    shiftDragZoom: false,
                    pinchRotate: false,
                    pinchZoom: false
                }),
            });

            var ZoomToNativeControl = biigle.$require('annotations.ol.ZoomToNativeControl');
            map.addControl(new ZoomToNativeControl({
                // fontawesome expand icon
                label: '\uf065'
            }));

            return map;
        },
        initLayersAndInteractions: function (map) {
            var styles = biigle.$require('annotations.stores.styles');

            this.annotationFeatures = new ol.Collection();

            this.annotationSource = new ol.source.Vector({
                features: this.annotationFeatures,
            });

            this.annotationLayer = new ol.layer.Vector({
                source: this.annotationSource,
                updateWhileAnimating: true,
                updateWhileInteracting: true,
                style: styles.features,
                opacity: this.annotationOpacity,
                name: 'annotations',
            });

            this.selectInteraction = new ol.interaction.Select({
                condition: ol.events.condition.click,
                style: styles.highlight,
                layers: [this.annotationLayer],
                multi: true,
            });

            this.selectedFeatures = this.selectInteraction.getFeatures();
            this.selectInteraction.on('select', this.handleFeatureSelect);

            map.addLayer(this.annotationLayer);
            map.addInteraction(this.selectInteraction);
        },

        emitCreateBookmark: function () {
            this.$emit('create-bookmark', this.video.currentTime);
        },
        resetInteractionMode: function () {
            this.interactionMode = 'default';
        },
        extractAnnotationFromFeature: function (feature) {
            return feature.get('annotation');
        },
        handleFeatureSelect: function (e) {
            this.$emit('select',
                e.selected.map(this.extractAnnotationFromFeature),
                e.deselected.map(this.extractAnnotationFromFeature),
                this.video.currentTime
            );
        },
        updateMousePosition: function (e) {
            this.mousePosition = e.coordinate;
        },
        emitTrack: function () {
            this.$emit('track');
        },
        emitMoveend: function (e) {
            var view = e.target.getView();
            this.$emit('moveend', view.getCenter(), view.getResolution());
        },
        initInitialCenterAndResolution: function (map) {
            var view = map.getView();
            if (this.initialResolution !==0) {
                view.setResolution(Math.min(view.getMaxResolution(), Math.max(view.getMinResolution(), this.initialResolution)));
            }

            if ((this.initialCenter[0] !== 0 || this.initialCenter[1] !== 0) && ol.extent.containsCoordinate(this.extent, this.initialCenter)) {
                view.setCenter(this.initialCenter);
            }
        },
    },
    watch: {
        selectedAnnotations: function (annotations) {
            var source = this.annotationSource;
            var features = this.selectedFeatures;
            if (source && features) {
                var feature;
                features.clear();
                annotations.forEach(function (annotation) {
                    feature = source.getFeatureById(annotation.id);
                    if (feature) {
                        features.push(feature);
                    }
                });
            }
        },
        isDefaultInteractionMode: function (isDefault) {
            this.selectInteraction.setActive(isDefault);
        },
        annotationOpacity: function (opactiy) {
            if (this.annotationLayer) {
                this.annotationLayer.setOpacity(opactiy);
            }
        },
    },
    created: function () {
        this.$once('map-ready', this.initLayersAndInteractions);
        this.$once('map-ready', this.initInitialCenterAndResolution);
        this.map = this.createMap();
        this.$emit('map-created', this.map);
        this.map.on('pointermove', this.updateMousePosition);
        this.map.on('moveend', this.emitMoveend);

        var kb = biigle.$require('keyboard');
        kb.on('Escape', this.resetInteractionMode, 0, this.listenerSet);

        // if (this.canAdd) {
        //     kb.on('b', this.emitCreateBookmark);
        // }

        var self = this;
        biigle.$require('events').$on('sidebar.toggle', function () {
            self.$nextTick(function () {
                self.map.updateSize();
            });
        });
    },
    mounted: function () {
        this.map.setTarget(this.$el);
    },
});
