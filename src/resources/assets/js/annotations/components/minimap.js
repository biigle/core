/**
 * The minimap of the canvas element
 *
 * @type {Object}
 */
biigle.$component('annotations.components.minimap', function () {
    return {
        template: '<div class="minimap"></div>',
        props: {
            extent: {
                type: Array,
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
        data() {
            return {
                //
            };
        },
        computed: {
            minimap() {
                return new ol.Map({
                    // remove controls
                    controls: [],
                    // disable interactions
                    interactions: []
                });
            },
            viewport() {
                return new ol.Feature();
            },
        },
        methods: {
            updateViewport() {
                // The map size and center might be undefined if the minimap is created
                // initially. This function will be called again once the map is ready.
                if (this.mapSize && this.mapView.getCenter()) {
                    this.viewport.setGeometry(ol.geom.Polygon.fromExtent(this.mapView.calculateExtent(this.mapSize)));
                }
            },
            dragViewport(e) {
                this.mapView.setCenter(e.coordinate);
            },
            updateMapSize(e) {
                this.mapSize = e.target.getSize();
            },
            updateMapView(e) {
                if (this.mapView) {
                    this.mapView.un('change:center', this.updateViewport);
                    this.mapView.un('change:resolution', this.updateViewport);
                }
                this.mapView = e.target.getView();
                this.mapView.on('change:center', this.updateViewport);
                this.mapView.on('change:resolution', this.updateViewport);
            },
            updateElementSize() {
                var imageWidth = this.extent[2];
                var imageHeight = this.extent[3];

                // Calculate resolution that fits the image into the minimap element.
                var resolution = Math.max(
                    imageWidth / this.intendedWidth,
                    imageHeight / this.intendedHeight
                );
                this.minimap.setView(new ol.View({
                    projection: this.mapView.getProjection(),
                    center: ol.extent.getCenter(this.extent),
                    resolution: resolution,
                }));

                // Update the minimap element size so it has the same dimensions than the
                // image displayed by OpenLayers.
                this.$el.style.width = Math.round(imageWidth / resolution) + 'px';
                this.$el.style.height = Math.round(imageHeight / resolution) + 'px';
                this.minimap.updateSize();
            },
            refreshImageLayer(e) {
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
            initImageLayer(layers) {
                layers.getArray().forEach(function (layer) {
                    this.refreshImageLayer({element: layer});
                }, this);
            },
        },
        watch: {
            // Refresh the view if the extent (i.e. image size) changed.
            extent() {
                this.updateElementSize();
            },
        },
        created() {
            var viewportSource = new ol.source.Vector();
            viewportSource.addFeature(this.viewport);

            var map = this.$parent.map;
            // Do not set these in data because they should not be made reactive. Vue
            // would propagate this and make the whole Map instance reactive. This might
            // cause infinite loops in watchers and computed properties.
            this.mapSize = map.getSize();
            this.updateMapView({target: map});
            map.on('change:size', this.updateMapSize);
            map.on('change:view', this.updateMapView);
            // Initialize the viewport once.
            map.once('postcompose', this.updateViewport);

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
        mounted() {
            this.updateElementSize();
            this.minimap.setTarget(this.$el);
            // Manually update the viewport in case the minimap was created/toggled when
            // the annotation map is already there.
            this.updateViewport();
        },
        beforeDestroy() {
            var map = this.$parent.map;
            this.mapView.un('change:center', this.updateViewport);
            this.mapView.un('change:resolution', this.updateViewport);
            map.un('change:size', this.updateMapSize);
            map.un('change:view', this.updateMapView);
            map.getLayers().un('add', this.refreshImageLayer);
        },
    };
});
