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
            // TODO
            // new ZoomToNativeControl({
            //     // bootstrap glyphicons resize-full icon
            //     label: '\ue096'
            // })
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
                required: true,
            },
            loading: {
                type: Boolean,
                default: false,
            },
        },
        data: function () {
            return {
            };
        },
        computed: {
            extent: function () {
                return [0, 0, this.image.width, this.image.height];
            },
            projection: function () {
                return new ol.proj.Projection({
                    code: 'biigle-image',
                    units: 'pixels',
                    extent: this.extent
                });
            },
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
            extent: function (extent) {
                // TODO use center and zoom of URL params if they xist
                var center = ol.extent.getCenter(extent);
                var zoom;

                map.setView(new ol.View({
                    projection: this.projection,
                    center: center,
                    zoom: zoom,
                    zoomFactor: 1.5,
                    // allow a maximum of 4x magnification
                    minResolution: 0.25,
                    // restrict movement
                    extent: extent
                }));

                if (zoom === undefined) {
                    map.getView().fit(extent, map.getSize());
                }
            },
        },
        created: function () {
            biigle.$require('biigle.events').$on('sidebar.toggle', function () {
                this.$nextTick(function () {
                    map.updateSize();
                });
            });
        },
        mounted: function () {
            map.setTarget(this.$el);
        },
    };
});
