/**
 * The annotator canvas
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationCanvas', function () {
    var map = new ol.Map({
        renderer: 'canvas',
        controls: [
            new ol.control.Zoom(),
            new ol.control.ZoomToExtent({
                tipLabel: 'Zoom to show whole image',
                // bootstrap glyphicons resize-small icon
                label: '\ue097'
            }),
            new ol.control.FullScreen({
                // bootstrap glyphicons fullscreen icon
                label: '\ue140'
            }),
        ],
        interactions: ol.interaction.defaults({
            altShiftDragRotate: false,
            doubleClickZoom: false,
            keyboard: false,
            shiftDragZoom: false,
            pinchRotate: false,
            pinchZoom: false
        })
    });

    var imageLayer = new ol.layer.Image();
    map.addLayer(imageLayer);

    return {
        components: {
            loaderBlock: biigle.$require('core.components.loaderBlock'),
        },
        props: {
            image: {
                type: HTMLCanvasElement,
            },
            loading: {
                type: Boolean,
                default: false,
            },
            center: {
                type: Array,
                default: undefined,
            },
            resolution: {
                type: Number,
                default: undefined,
            },
        },
        data: function () {
            return {
                initialized: false,
            };
        },
        computed: {
            extent: function () {
                if (this.image) {
                    return [0, 0, this.image.width, this.image.height];
                }

                return [0, 0, 0, 0];
            },
            projection: function () {
                return new ol.proj.Projection({
                    code: 'biigle-image',
                    units: 'pixels',
                    extent: this.extent
                });
            },
        },
        methods: {

        },
        watch: {
            image: function (image) {
                imageLayer.setSource(new ol.source.Canvas({
                    canvas: image,
                    projection: this.projection,
                    canvasExtent: this.extent,
                    canvasSize: [image.width, image.height]
                }));
            },
            extent: function (extent, oldExtent) {
                // The extent only truly changes if the width and height changed.
                if (extent[2] === oldExtent[2] && extent[3] === oldExtent[3]) {
                    return;
                }

                var center = ol.extent.getCenter(extent);

                // Only use this.center once on initialization. If the extent changes
                // afterwards, the center should be reset.
                if (!this.initialized) {
                    center = this.center || center;
                    this.initialized = true;
                }

                map.setView(new ol.View({
                    projection: this.projection,
                    center: center,
                    resolution: this.resolution,
                    zoomFactor: 1.5,
                    // allow a maximum of 4x magnification
                    minResolution: 0.25,
                    // restrict movement
                    extent: extent
                }));

                if (this.resolution === undefined) {
                    map.getView().fit(extent, map.getSize());
                }
            },
        },
        created: function () {
            var self = this;

            biigle.$require('biigle.events').$on('sidebar.toggle', function () {
                self.$nextTick(function () {
                    map.updateSize();
                });
            });

            map.on('moveend', function (e) {
                var view = map.getView();
                self.$emit('moveend', {
                    center: view.getCenter(),
                    resolution: view.getResolution(),
                });
            });
        },
        mounted: function () {
            map.setTarget(this.$el);

            var ZoomToNativeControl = biigle.$require('annotations.ol.ZoomToNativeControl');
            map.addControl(new ZoomToNativeControl({
                // bootstrap glyphicons resize-full icon
                label: '\ue096'
            }));
        },
    };
});
