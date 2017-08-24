/**
 * The minimap of the canvas element
 *
 * @type {Object}
 */
biigle.$component('annotations.components.minimap', function () {
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
            refreshViewport: function () {
                viewport.setGeometry(ol.geom.Polygon.fromExtent(mapView.calculateExtent(mapSize)));
            },
            dragViewport: function (e) {
                mapView.setCenter(e.coordinate);
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
            var map = biigle.$require('annotations.stores.map');
            mapSize = map.getSize();
            mapView = map.getView();

            // Todo maybe listen to change:layerGroup? Image layer is not present
            // from the start any more.
            minimap.addLayer(map.getLayers().item(0));
            minimap.addLayer(new ol.layer.Vector({
                source: viewportSource,
                style: biigle.$require('annotations.stores.styles').viewport
            }));

            map.on('postcompose', this.refreshViewport);
            map.on('change:size', function () {
                mapSize = map.getSize();
            });
            map.on('change:view', function () {
                mapView = map.getView();
            });

            minimap.on('pointerdrag', this.dragViewport);
            minimap.on('click', this.dragViewport);
        },
        watch: {
            // Refresh the view if the extent (i.e. image size) changed.
            extent: function (extent) {
                // Calculate resolution that fits the image into the minimap element.
                var resolution = Math.max(
                    extent[2] / this.intendedWidth,
                    extent[3] / this.intendedHeight
                );
                minimap.setView(new ol.View({
                    projection: this.projection,
                    center: ol.extent.getCenter(extent),
                    resolution: resolution,
                }));

                // Update the minimap element size so it has the same dimensions than the
                // image displayed by OpenLayers.
                this.$el.style.width = Math.round(extent[2] / resolution) + 'px';
                this.$el.style.height = Math.round(extent[3] / resolution) + 'px';
                minimap.updateSize();
            },
        },
        mounted: function () {
            minimap.setTarget(this.$el);
        },
    };
});
