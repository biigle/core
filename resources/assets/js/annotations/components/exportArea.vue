<script>
import Circle from '@biigle/ol/style/Circle';
import Collection from '@biigle/ol/Collection';
import DrawInteraction from '@biigle/ol/interaction/Draw';
import Events from '../../core/events';
import ExportAreaApi from '../api/exportArea';
import Feature from '@biigle/ol/Feature';
import Fill from '@biigle/ol/style/Fill';
import ModifyInteraction from '@biigle/ol/interaction/Modify';
import Rectangle from '@biigle/ol/geom/Rectangle';
import Stroke from '@biigle/ol/style/Stroke';
import Style from '@biigle/ol/style/Style';
import VectorLayer from '@biigle/ol/layer/Vector';
import VectorSource from '@biigle/ol/source/Vector';
import {handleErrorResponse} from '../../core/messages/store';
import {never as neverCondition} from '@biigle/ol/events/condition';

/**
 * The plugin component to edit the export area in the annotation tool.
 *
 * @type {Object}
 */
export default {
    props: {
        settings: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            opacityValue: '1',
            currentImage: null,
            isEditing: false,
            exportArea: null,
            volumeId: null,
        };
    },
    computed: {
        opacity() {
            return parseFloat(this.opacityValue);
        },
        shown() {
            return this.opacity > 0;
        },
        height() {
            return this.currentImage ? this.currentImage.height : 0;
        },
        hasExportArea() {
            return this.exportArea !== null;
        },
        layer() {
            return new VectorLayer({
                source: new VectorSource({
                    features: new Collection(),
                }),
                style: [
                    new Style({
                        stroke: new Stroke({
                            color: 'white',
                            width: 4
                        }),
                        image: new Circle({
                            radius: 6,
                            fill: new Fill({
                                color: '#666666'
                            }),
                            stroke: new Stroke({
                                color: 'white',
                                width: 2,
                                lineDash: [2]
                            }),
                        }),
                    }),
                    new Style({
                        stroke: new Stroke({
                            color: '#666666',
                            width: 1,
                            lineDash: [2]
                        }),
                    }),
                ],
                zIndex: 4,
                updateWhileAnimating: true,
                updateWhileInteracting: true,
            });
        },
        drawInteraction() {
            return new DrawInteraction({
                source: this.layer.getSource(),
                type: 'Rectangle',
                style: this.layer.getStyle(),
                minPoints: 2,
                maxPoints: 2,
                geometryFunction(coordinates, opt_geometry) {
                    if (coordinates.length > 1) {
                        coordinates = [
                            coordinates[0],
                            [coordinates[0][0], coordinates[1][1]],
                            coordinates[1],
                            [coordinates[1][0], coordinates[0][1]]
                        ];
                    }
                    let geometry = opt_geometry;
                    if (geometry) {
                       geometry.setCoordinates([coordinates]);
                    } else {
                        geometry = new Rectangle([coordinates]);
                    }
                    return geometry;
                }
            });
        },
        modifyInteraction() {
            return new ModifyInteraction({
                features: this.layer.getSource().getFeaturesCollection(),
                style: this.layer.getStyle(),
                deleteCondition: neverCondition,
            });
        },
    },
    methods: {
        toggleEditing() {
            this.isEditing = !this.isEditing;
            if (this.isEditing) {
                this.drawInteraction.setActive(true);
                this.modifyInteraction.setActive(true);
            } else {
                this.drawInteraction.setActive(false);
                this.modifyInteraction.setActive(false);
            }
        },
        deleteArea() {
            if (this.hasExportArea && confirm('Do you really want to delete the export area?')) {
                let source = this.layer.getSource();
                let feature = source.getFeatures()[0];
                source.clear();
                ExportAreaApi.delete({id: this.volumeId})
                    .then(() => this.exportArea = null)
                    .catch(function (response) {
                        source.addFeature(feature);
                        handleErrorResponse(response);
                    });
            }
        },
        updateCurrentImage(id, image) {
            this.currentImage = image;
        },
        maybeDrawArea() {
            this.clearSource();
            if (this.exportArea && this.height > 0) {
                // Handle coordinates for tiled and regular images differently.
                let height = this.currentImage.tiled ? 0 : this.height;

                let geometry = new Rectangle([[
                    // Swap y coordinates for OpenLayers.
                    [this.exportArea[0], height - this.exportArea[1]],
                    [this.exportArea[0], height - this.exportArea[3]],
                    [this.exportArea[2], height - this.exportArea[3]],
                    [this.exportArea[2], height - this.exportArea[1]],
                ]]);
                this.layer.getSource().addFeature(new Feature({geometry: geometry}));
            }
        },
        handleModifyend(e) {
            this.updateExportArea(e.features.item(0));
        },
        clearSource() {
            this.layer.getSource().clear();
        },
        handleDrawend(e) {
            let source = this.layer.getSource();
            let oldFeature = source.getFeatures()[0];
            source.clear();
            // Remove the feature again if creating it failed.
            this.updateExportArea(e.feature).catch(function () {
                source.clear();
                if (oldFeature) {
                    source.addFeature(oldFeature);
                }
            });
        },
        updateExportArea(feature) {
            let coordinates = feature.getGeometry().getCoordinates()[0];
            // Handle coordinates for tiled and regular images differently.
            let height = this.currentImage.tiled ? 0 : this.height;
            coordinates = [
                coordinates[0][0], height - coordinates[0][1],
                coordinates[2][0], height - coordinates[2][1],
            ].map(Math.round);

            let promise = ExportAreaApi.save({id: this.volumeId}, {coordinates: coordinates})
                .then(() => this.exportArea = coordinates);

            promise.catch(handleErrorResponse);

            return promise;
        },
        extendMap(map) {
            map.addLayer(this.layer);
            map.addInteraction(this.drawInteraction);
            map.addInteraction(this.modifyInteraction);
        },
    },
    watch: {
        opacity(opacity) {
            if (opacity < 1) {
                this.settings.set('exportAreaOpacity', opacity);
            } else {
                this.settings.delete('exportAreaOpacity');
            }

            this.layer.setOpacity(opacity);
        },
        exportArea() {
            this.maybeDrawArea();
        },
        height() {
            this.maybeDrawArea();
        },
    },
    created() {
        this.volumeId = biigle.$require('annotations.volumeId');

        if (this.settings.has('exportAreaOpacity')) {
            this.opacityValue = this.settings.get('exportAreaOpacity');
        }

        this.exportArea = biigle.$require('annotations.exportArea');

        this.drawInteraction.setActive(false);
        this.modifyInteraction.setActive(false);
        this.drawInteraction.on('drawend', this.handleDrawend);
        this.modifyInteraction.on('modifyend', this.handleModifyend);

        Events.$on('images.change', this.updateCurrentImage);
        Events.$on('annotations.map.init', this.extendMap);
    },
};
</script>
