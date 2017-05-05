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

    var annotationFeatures = new ol.Collection();
    var annotationSource = new ol.source.Vector({
        features: annotationFeatures
    });
    var annotationLayer = new ol.layer.Vector({
        source: annotationSource,
        zIndex: 100,
        updateWhileAnimating: true,
        updateWhileInteracting: true
    });
    map.addLayer(annotationLayer);

    return {
        components: {
            loaderBlock: biigle.$require('core.components.loaderBlock'),
        },
        props: {
            image: {
                type: HTMLCanvasElement,
            },
            annotations: {
                type: Array,
                default: function () {
                    return [];
                },
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
            // Determines the OpenLayers geometry object for an annotation.
            getGeometry: function (annotation) {
                var points = annotation.points;
                var newPoints = [];
                var height = this.image.height;
                for (var i = 0; i < points.length; i += 2) {
                    newPoints.push([
                        points[i],
                        // Invert the y axis to OpenLayers coordinates.
                        // Circles have no fourth point so we take 0.
                        height - (points[i + 1] || 0)
                    ]);
                }

                switch (annotation.shape) {
                    case 'Point':
                        return new ol.geom.Point(newPoints[0]);
                    case 'Rectangle':
                        return new ol.geom.Rectangle([newPoints]);
                    case 'Polygon':
                        return new ol.geom.Polygon([newPoints]);
                    case 'LineString':
                        return new ol.geom.LineString(newPoints);
                    case 'Circle':
                        // radius is the x value of the second point of the circle
                        return new ol.geom.Circle(newPoints[0], newPoints[1][0]);
                    // unsupported shapes are ignored
                    default:
                        console.error('Unknown annotation shape: ' + annotation.shape);
                        return;
                }
            },
            // Creates an OpenLayers feature object from an annotation.
            createFeature: function (annotation) {
                var feature = new ol.Feature({
                    geometry: this.getGeometry(annotation),
                    id: annotation.id,
                });

                feature.set('annotation', annotation);
                if (annotation.labels && annotation.labels.length > 0) {
                    feature.set('color', annotation.labels[0].label.color);
                }
                // TODO
                // feature.on('change', handleGeometryChange);

                return feature;
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
            annotations: function (annotations) {
                annotationSource.clear(true);
                annotationSource.addFeatures(this.annotations.map(this.createFeature));
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

            annotationLayer.setStyle(biigle.$require('annotations.stores.styles').features);
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
