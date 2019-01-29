biigle.$component('videos.components.videoScreen', {
    mixins: [
        biigle.$require('videos.components.videoScreen.videoPlayback'),
        biigle.$require('videos.components.videoScreen.annotationPlayback'),
        biigle.$require('videos.components.videoScreen.drawInteractions'),
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
                '<control-button icon="icon-linestring" title="Start a line annotation 𝗙" v-on:click="drawLineString" :disabled="hasNoSelectedLabel" :hover="false" :open="isDrawingLineString" :active="isDrawingLineString">' +
                    '<control-button icon="fa-check" title="Finish the line annotation" v-on:click="finishDrawAnnotation"></control-button>' +
                '</control-button>' +
                '<control-button icon="icon-polygon" title="Start a polygon annotation 𝗚" v-on:click="drawPolygon" :disabled="hasNoSelectedLabel" :hover="false" :open="isDrawingPolygon" :active="isDrawingPolygon">' +
                    '<control-button icon="fa-check" title="Finish the polygon annotation" v-on:click="finishDrawAnnotation"></control-button>' +
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
            interactionMode: 'default',
        };
    },
    computed: {
        hasSelectedAnnotations: function () {
            return this.selectedAnnotations.length > 0;
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

            this.selectInteraction = new ol.interaction.Select({
                condition: ol.events.condition.click,
                style: styles.highlight,
                layers: [this.annotationLayer],
                multi: true
            });

            this.selectedFeatures = this.selectInteraction.getFeatures();
            this.selectInteraction.on('select', this.handleFeatureSelect);

            this.annotationLayer.setMap(map);
            map.addInteraction(this.selectInteraction);
        },

        emitCreateBookmark: function () {
            this.$emit('create-bookmark', this.video.currentTime);
        },
        resetInteractionMode: function () {
            this.interactionMode = 'default';
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
