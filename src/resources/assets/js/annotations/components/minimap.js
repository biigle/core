/**
 * The minimap of the canvas element
 *
 * @type {Object}
 */
biigle.$component('annotations.components.minimap', function () {
    var initialized = false;
    var minimap = new ol.Map({
        // remove controls
        controls: [],
        // disable interactions
        interactions: []
    });

    var viewportSource = new ol.source.Vector();
    var viewport = new ol.Feature();
    viewportSource.addFeature(viewport);

    var mapView, mapSize;

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
        },
        methods: {
            // Move the viewport rectangle on the minimap.
            updateViewport: function () {
                viewport.setGeometry(ol.geom.Polygon.fromExtent(mapView.calculateExtent(mapSize)));
            },
            dragViewport: function (e) {
                mapView.setCenter(e.coordinate);
            },
            updateMapSize: function (e) {
                mapSize = e.target.getSize();
            },
            updateMapView: function (e) {
                mapView = e.target.getView();
            },
            updateElementSize: function () {
                // Calculate resolution that fits the image into the minimap element.
                var resolution = Math.max(
                    this.extent[2] / this.intendedWidth,
                    this.extent[3] / this.intendedHeight
                );
                minimap.setView(new ol.View({
                    projection: this.projection,
                    center: ol.extent.getCenter(this.extent),
                    resolution: resolution,
                }));

                // Update the minimap element size so it has the same dimensions than the
                // image displayed by OpenLayers.
                this.$el.style.width = Math.round(this.extent[2] / resolution) + 'px';
                this.$el.style.height = Math.round(this.extent[3] / resolution) + 'px';
                minimap.updateSize();
            },
        },
        computed: {
            // Width and height are only evaluated once on initialization. They will be
            // used to calculate the actual minimap size based on the image aspect ratio.
            intendedWidth: function () {
                return this.$el.clientWidth;
            },
            intendedHeight: function () {
                return this.$el.clientHeight;
            },
        },
        created: function () {
            // Dot this only once and retain the minimap object even if the component
            // is hidden/destroyed.
            if (!initialized) {
                initialized = true;
                var map = biigle.$require('annotations.stores.map');
                mapSize = map.getSize();
                mapView = map.getView();
                map.on('postcompose', this.updateViewport);
                map.on('change:size', this.updateMapSize);
                map.on('change:view', this.updateMapView);

                minimap.addLayer(map.getLayers().item(0));
                minimap.addLayer(new ol.layer.Vector({
                    source: viewportSource,
                    style: biigle.$require('annotations.stores.styles').viewport
                }));
                minimap.on('pointerdrag', this.dragViewport);
                minimap.on('click', this.dragViewport);
            }
        },
        watch: {
            // Refresh the view if the extent (i.e. image size) changed.
            extent: function () {
                this.updateElementSize();
            },
        },
        mounted: function () {
            minimap.setTarget(this.$el);
            this.updateElementSize();
        },
    };
});
