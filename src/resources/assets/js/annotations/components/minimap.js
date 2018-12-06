/**
 * The minimap of the canvas element
 *
 * @type {Object}
 */
biigle.$component('annotations.components.minimap', function () {
    return {
        props: {
            extent: {
                type: Array,
                required: true,
            },
            projection: {
                type: Object,
                required: true,
            },
            intendedWidth: {
                type: Number,
                default: 250,
            },
            intendedHeight: {
                type: Number,
                default: 200,
            },
        },
        data: function () {
            return {
                mapView: null,
                mapSize: null,
            };
        },
        computed: {
            minimap: function () {
                return new ol.Map({
                    // remove controls
                    controls: [],
                    // disable interactions
                    interactions: []
                });
            },
            viewport: function () {
                return new ol.Feature();
            },
        },
        methods: {
            updateViewport: function () {
                // The map size might be undefined if the minimap is created initially.
                // This function will be called again once the map is ready.
                if (this.mapSize) {
                    this.viewport.setGeometry(ol.geom.Polygon.fromExtent(this.mapView.calculateExtent(this.mapSize)));
                }
            },
            dragViewport: function (e) {
                this.mapView.setCenter(e.coordinate);
            },
            updateMapSize: function (e) {
                this.mapSize = e.target.getSize();
            },
            updateMapView: function (e) {
                this.mapView = e.target.getView();
            },
            updateElementSize: function () {
                var imageWidth = this.extent[2];
                var imageHeight = this.extent[3];

                // Calculate resolution that fits the image into the minimap element.
                var resolution = Math.max(
                    imageWidth / this.intendedWidth,
                    imageHeight / this.intendedHeight
                );
                this.minimap.setView(new ol.View({
                    projection: this.projection,
                    center: ol.extent.getCenter(this.extent),
                    resolution: resolution,
                }));

                // Update the minimap element size so it has the same dimensions than the
                // image displayed by OpenLayers.
                this.$el.style.width = Math.round(imageWidth / resolution) + 'px';
                this.$el.style.height = Math.round(imageHeight / resolution) + 'px';
                this.minimap.updateSize();
            },
            refreshImageLayer: function (e) {
                // Set or refresh the layer that displays the image. This is done after
                // the minimap element was created. The annotationCanvas can display
                // either a regular image or a tiled image. If the type changes we have
                // to update the layer here, too.
                var name = e.element.get('name');
                if (name && name.startsWith('image')) {
                    var layers = this.minimap.getLayers();
                    if (layers.getLength() > 1) {
                        layers.setAt(0, e.element);
                    } else {
                        layers.insertAt(0, e.element);
                    }
                }
            },
            initImageLayer: function (layers) {
                layers.forEach(function (layer) {
                    this.refreshImageLayer({element: layer});
                }, this);
            },
        },
        watch: {
            // Refresh the view if the extent (i.e. image size) changed.
            extent: function () {
                this.updateElementSize();
            },
        },
        created: function () {
            var viewportSource = new ol.source.Vector();
            viewportSource.addFeature(this.viewport);

            var map = this.$parent.map;
            this.mapSize = map.getSize();
            this.mapView = map.getView();
            map.on('postcompose', this.updateViewport);
            map.on('change:size', this.updateMapSize);
            map.on('change:view', this.updateMapView);

            // Add the viewport layer now. Add the image layer later when it was
            // added to the map.
            this.minimap.addLayer(new ol.layer.Vector({
                source: viewportSource,
                style: biigle.$require('annotations.stores.styles').viewport
            }));
            map.getLayers().on('add', this.refreshImageLayer);
            this.minimap.on('pointerdrag', this.dragViewport);
            this.minimap.on('click', this.dragViewport);
            this.initImageLayer(map.getLayers());
        },
        mounted: function () {
            this.updateElementSize();
            this.minimap.setTarget(this.$el);
            // Manually update the viewport in case the minimap was created/toggled when
            // the annotation map is already there.
            this.updateViewport();
        },
        beforeDestroy: function () {
            var map = this.$parent.map;
            map.un('postcompose', this.updateViewport);
            map.un('change:size', this.updateMapSize);
            map.un('change:view', this.updateMapView);
            map.getLayers().un('add', this.refreshImageLayer);
        },
    };
});
