<template>
    <div class="minimap"></div>
</template>

<script>
import Feature from '@biigle/ol/Feature';
import ImageLayer from '@biigle/ol/layer/Image';
import Map from '@biigle/ol/Map';
import Styles from '../stores/styles.js';
import TileLayer from '@biigle/ol/layer/Tile';
import VectorLayer from '@biigle/ol/layer/Vector';
import VectorSource from '@biigle/ol/source/Vector';
import View from '@biigle/ol/View';
import ZoomifySource from '@biigle/ol/source/Zoomify';
import {fromExtent} from '@biigle/ol/geom/Polygon';
import {getCenter} from '@biigle/ol/extent';

/**
 * The minimap of the canvas element
 *
 * @type {Object}
 */
export default {
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
        //
    },
    methods: {
        updateViewport() {
            // The map size and center might be undefined if the minimap is created
            // initially. This function will be called again once the map is ready.
            if (this.mapSize && this.mapView.getCenter() && this.mapView.getResolution()) {
                this.viewport.setGeometry(fromExtent(this.mapView.calculateExtent(this.mapSize)));
            }
        },
        dragViewport(e) {
            this.mapView.setCenter(e.coordinate);
        },
        updateMapSize(e) {
            this.mapSize = e.target.getSize();
            this.updateViewport();
        },
        updateMapView(e) {
            if (this.mapView) {
                this.mapView.un('change:center', this.updateViewport);
                this.mapView.un('change:resolution', this.updateViewport);
            }
            this.mapView = e.target.getView();
            this.mapView.on('change:center', this.updateViewport);
            this.mapView.on('change:resolution', this.updateViewport);
            this.updateViewport();
        },
        updateElementSize() {
            let imageWidth = this.extent[2];
            let imageHeight = this.extent[3];

            // Calculate resolution that fits the image into the minimap element.
            let resolution = Math.max(
                imageWidth / this.intendedWidth,
                imageHeight / this.intendedHeight
            );
            this.minimap.setView(new View({
                projection: this.mapView.getProjection(),
                center: getCenter(this.extent),
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
            let name = e.element.get('name');
            if (name && name.startsWith('image')) {
                if (this.originalLayer) {
                    this.originalLayer.un('change:source', this.handleChangeSource);
                }
                this.originalLayer = e.element;
                if (this.originalLayer instanceof TileLayer) {
                    this.currentLayer = new TileLayer({
                        source: this.originalLayer.getSource()
                    });
                } else {
                    this.currentLayer = new ImageLayer({
                        source: this.originalLayer.getSource()
                    });
                }
                this.originalLayer.on('change:source', this.handleChangeSource);

                let layers = this.minimap.getLayers();
                if (layers.getLength() > 1) {
                    layers.setAt(0, this.currentLayer);
                } else {
                    layers.insertAt(0, this.currentLayer);
                }
            }
        },
        handleChangeSource(e) {
            if (this.currentLayer) {
                let source = e.target.getSource();

                // Create a new tile source instead of sharing it because otherwise the
                // minimap would flicker on zoom/pan sometimes.
                if (this.currentLayer instanceof TileLayer) {
                    let image = this.$parent.image
                    source = new ZoomifySource({
                        url: image.url,
                        size: [image.width, image.height],
                        extent: [0, 0, image.width, image.height],
                        transition: 0,
                    });
                }

                this.currentLayer.setSource(source);
            }
        },
        initImageLayer(layers) {
            layers.getArray().forEach((layer) => {
                this.refreshImageLayer({element: layer});
            });
        },
    },
    watch: {
        // Refresh the view if the extent (i.e. image size) changed.
        extent() {
            this.updateElementSize();
        },
    },
    created() {
        // Must not be reactive.
        this.originalLayer = null;
        this.currentLayer = null;

        this.minimap = new Map({
            // remove controls
            controls: [],
            // disable interactions
            interactions: []
        });
        this.viewport = new Feature();

        let viewportSource = new VectorSource();
        viewportSource.addFeature(this.viewport);

        let map = this.$parent.map;
        // Do not set these in data because they should not be made reactive. Vue
        // would propagate this and make the whole Map instance reactive. This might
        // cause infinite loops in watchers and computed properties.
        this.mapSize = map.getSize();
        this.updateMapView({target: map});
        map.on('change:size', this.updateMapSize);
        map.on('change:view', this.updateMapView);

        // Add the viewport layer now. Add the image layer later when it was
        // added to the map.
        this.minimap.addLayer(new VectorLayer({
            source: viewportSource,
            style: Styles.viewport
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
    beforeUnmount() {
        let map = this.$parent.map;
        this.mapView.un('change:center', this.updateViewport);
        this.mapView.un('change:resolution', this.updateViewport);
        map.un('change:size', this.updateMapSize);
        map.un('change:view', this.updateMapView);
        map.getLayers().un('add', this.refreshImageLayer);
    },
};
</script>
