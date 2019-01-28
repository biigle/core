biigle.$component('videos.components.videoScreen', {
    mixins: [
        biigle.$require('videos.components.videoScreen.videoPlayback'),
        biigle.$require('videos.components.videoScreen.annotationPlayback'),
    ],
    template: '<div class="video-screen">' +
        '<div class="controls">' +
            '<div class="btn-group">' +
                '<control-button v-if="playing" icon="fa-pause" title="Pause 𝗦𝗽𝗮𝗰𝗲𝗯𝗮𝗿" v-on:click="pause"></control-button>' +
                '<control-button v-else icon="fa-play" title="Play 𝗦𝗽𝗮𝗰𝗲𝗯𝗮𝗿" v-on:click="play"></control-button>' +
            '</div>' +
            '<div v-if="canAdd" class="btn-group">' +
                '<control-button icon="icon-point" title="Start a point annotation 𝗔" v-on:click="drawPoint" :disabled="hasNoSelectedLabel" :hover="false" :open="isDrawingPoint" :active="isDrawingPoint">' +
                    '<control-button icon="fa-check" title="Finish the point annotation" v-on:click="finishDrawAnnotation"></control-button>' +
                '</control-button>' +
                '<control-button icon="icon-rectangle" title="Start a rectangle annotation 𝗦" v-on:click="drawRectangle" :disabled="hasNoSelectedLabel" :hover="false" :open="isDrawingRectangle" :active="isDrawingRectangle">' +
                    '<control-button icon="fa-check" title="Finish the rectangle annotation" v-on:click="finishDrawAnnotation"></control-button>' +
                '</control-button>' +
                '<control-button icon="icon-circle" title="Start a circle annotation 𝗗" v-on:click="drawCircle" :disabled="hasNoSelectedLabel" :hover="false" :open="isDrawingCircle" :active="isDrawingCircle">' +
                    '<control-button icon="fa-check" title="Finish the circle annotation" v-on:click="finishDrawAnnotation"></control-button>' +
                '</control-button>' +
            '</div>' +
            '<div v-if="canDelete || canAdd" class="btn-group">' +
                '<control-button v-if="canDelete" icon="fa-trash" title="Delete selected annotations 𝗗𝗲𝗹𝗲𝘁𝗲" v-on:click="emitDelete" :disabled="!hasSelectedAnnotations"></control-button>' +
                '<control-button v-if="canAdd" icon="fa-bookmark" title="Create a bookmark 𝗕" v-on:click="emitCreateBookmark"></control-button>' +
            '</div>' +
        '</div>' +
    '</div>',
    components: {
        controlButton: biigle.$require('annotations.components.controlButton'),
    },
    props: {
        annotations: {
            type: Array,
            default: function () {
                return [];
            },
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
        video: {
            type: HTMLVideoElement,
            required: true,
        },
    },
    data: function () {
        return {
            pendingAnnotation: {},
            interactionMode: 'default',
        };
    },
    computed: {
        hasSelectedLabel: function () {
            return !!this.selectedLabel;
        },
        hasNoSelectedLabel: function () {
            return !this.selectedLabel;
        },
        hasSelectedAnnotations: function () {
            return this.selectedAnnotations.length > 0;
        },
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
            });

            this.pendingAnnotationSource = new ol.source.Vector();

            this.pendingAnnotationLayer = new ol.layer.Vector({
                opacity: 0.5,
                source: this.pendingAnnotationSource,
                updateWhileAnimating: true,
                updateWhileInteracting: true,
                style: styles.editing,
            });

            this.selectInteraction = new ol.interaction.Select({
                condition: ol.events.condition.click,
                style: styles.highlight,
                layers: [this.annotationLayer],
                multi: true
            });

            this.selectedFeatures = this.selectInteraction.getFeatures();
            this.selectInteraction.on('select', this.handleFeatureSelect);

            this.annotationLayer.setMap(map);
            this.pendingAnnotationLayer.setMap(map);
            map.addInteraction(this.selectInteraction);
        },

        emitCreateBookmark: function () {
            this.$emit('create-bookmark', this.video.currentTime);
        },
        draw: function (name) {
            if (this['isDrawing' + name]) {
                this.resetInteractionMode();
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
        maybeUpdateDrawInteractionMode: function (mode) {
            this.resetPendingAnnotation();

            if (this.drawInteraction) {
                this.map.removeInteraction(this.drawInteraction);
                this.drawInteraction = undefined;
            }

            if (this.isDrawing && this.hasSelectedLabel) {
                var shape = mode.slice(4); // Remove the 'draw' prefix.
                this.pause();
                this.drawInteraction = new ol.interaction.Draw({
                    source: this.pendingAnnotationSource,
                    type: shape,
                    style: biigle.$require('annotations.stores.styles').editing,
                });
                this.drawInteraction.on('drawend', this.extendPendingAnnotation);
                this.map.addInteraction(this.drawInteraction);
                this.pendingAnnotation.shape = shape;
            }
        },
        resetInteractionMode: function () {
            this.interactionMode = 'default';
        },
        finishDrawAnnotation: function () {
            this.$emit('create-annotation', this.pendingAnnotation);
            this.resetInteractionMode();
        },
        resetPendingAnnotation: function () {
            this.pendingAnnotationSource.clear();
            this.pendingAnnotation = {
                shape: '',
                frames: [],
                points: [],
            };
        },
        extendPendingAnnotation: function (e) {
            var lastFrame = this.pendingAnnotation.frames[this.pendingAnnotation.frames.length - 1];
            if (lastFrame === undefined || lastFrame < this.video.currentTime) {
                this.pendingAnnotation.frames.push(this.video.currentTime);
                this.pendingAnnotation.points.push(this.getPointsFromGeometry(e.feature.getGeometry()));
            } else {
                this.pendingAnnotationSource.once('addfeature', function (e) {
                    this.removeFeature(e.feature);
                });
            }

            // if (this.video.currentTime < this.video.duration) {
            //     this.play();
            //     setTimeout(this.pause, 1000);
            // }
        },
        handleFeatureSelect: function (e) {
            this.$emit('select',
                e.selected.map(function (feature) {
                    return feature.get('annotation');
                }),
                e.selected.map(function () {
                    return this.video.currentTime;
                }, this)
            );
        },
        emitDelete: function () {
            if (this.canDelete && this.hasSelectedAnnotations) {
                this.$emit('delete');
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
    },
    created: function () {
        this.$once('map-ready', this.initLayersAndInteractions);
        this.map = this.createMap();
        this.$emit('map-created', this.map);

        var kb = biigle.$require('keyboard');

        if (this.canAdd) {
            kb.on('a', this.drawPoint, 0, this.listenerSet);
            // kb.on('s', this.drawRectangle, 0, this.listenerSet);
            kb.on('d', this.drawCircle, 0, this.listenerSet);
            // kb.on('D', this.drawEllipse, 0, this.listenerSet);
            // kb.on('f', this.drawLineString, 0, this.listenerSet);
            // kb.on('g', this.drawPolygon, 0, this.listenerSet);
            this.$watch('interactionMode', this.maybeUpdateDrawInteractionMode);

            kb.on('b', this.emitCreateBookmark);
        }

        if (this.canDelete) {
            kb.on('Delete', this.emitDelete);
        }

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
