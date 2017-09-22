/**
 * The plugin component to edit the export area in the annotation tool.
 *
 * @type {Object}
 */
biigle.$require('annotations.components.settingsTabPlugins').exportArea = {
    props: {
        settings: {
            type: Object,
            required: true,
        },
    },
    data: function () {
        return {
            opacityValue: '1',
            currentImage: null,
            isEditing: false,
            exportArea: null,
        };
    },
    computed: {
        opacity: function () {
            return parseFloat(this.opacityValue);
        },
        shown: function () {
            return this.opacity > 0;
        },
        height: function () {
            return this.currentImage ? this.currentImage.height : 0;
        },
        hasExportArea: function () {
            return this.exportArea !== null;
        },
        exportAreaApi: function () {
            return biigle.$require('export.api.volumes');
        },
        volumeId: function () {
            return biigle.$require('annotations.volumeId');
        },
        messages: function () {
            return biigle.$require('messages.store');
        },
        layer: function () {
            return new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: new ol.Collection(),
                }),
                style: [
                    new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: 'white',
                            width: 4
                        }),
                        image: new ol.style.Circle({
                            radius: 6,
                            fill: new ol.style.Fill({
                                color: '#666666'
                            }),
                            stroke: new ol.style.Stroke({
                                color: 'white',
                                width: 2,
                                lineDash: [2]
                            })
                        })
                    }),
                    new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: '#666666',
                            width: 1,
                            lineDash: [2]
                        })
                    })
                ],
                zIndex: 4,
                updateWhileAnimating: true,
                updateWhileInteracting: true,
            });
        },
        drawInteraction: function () {
            return new ol.interaction.Draw({
                source: this.layer.getSource(),
                type: 'Rectangle',
                style: this.layer.getStyle(),
                minPoints: 2,
                maxPoints: 2,
                geometryFunction: function (coordinates, opt_geometry) {
                    if (coordinates.length > 1) {
                        coordinates = [
                            coordinates[0],
                            [coordinates[0][0], coordinates[1][1]],
                            coordinates[1],
                            [coordinates[1][0], coordinates[0][1]]
                        ];
                    }
                    var geometry = opt_geometry;
                    if (geometry) {
                       geometry.setCoordinates([coordinates]);
                    } else {
                        geometry = new ol.geom.Rectangle([coordinates]);
                    }
                    return geometry;
                }
            });
        },
        modifyInteraction: function () {
            return new ol.interaction.Modify({
                features: this.layer.getSource().getFeaturesCollection(),
                style: this.layer.getStyle(),
                deleteCondition: ol.events.condition.never
            });
        },
    },
    methods: {
        toggleEditing: function () {
            this.isEditing = !this.isEditing;
            if (this.isEditing) {
                this.drawInteraction.setActive(true);
                this.modifyInteraction.setActive(true);
            } else {
                this.drawInteraction.setActive(false);
                this.modifyInteraction.setActive(false);
            }
        },
        deleteArea: function () {
            if (this.hasExportArea && confirm('Do you really want to delete the export area?')) {
                var self = this;
                var source = this.layer.getSource();
                var feature = source.getFeatures()[0];
                source.clear();
                this.exportAreaApi.delete({id: this.volumeId})
                    .then(function () {
                        self.exportArea = null;
                    })
                    .catch(function (response) {
                        source.addFeature(feature);
                        self.messages.handleErrorResponse(response);
                    });
            }
        },
        updateCurrentImage: function (id, image) {
            this.currentImage = image;
        },
        maybeDrawArea: function () {
            this.clearSource();
            if (this.exportArea && this.height > 0) {
                // Handle coordinates for tiled and regular images differently.
                var height = this.currentImage.tiled ? 0 : this.height;

                var geometry = new ol.geom.Rectangle([[
                    // Swap y coordinates for OpenLayers.
                    [this.exportArea[0], height - this.exportArea[1]],
                    [this.exportArea[0], height - this.exportArea[3]],
                    [this.exportArea[2], height - this.exportArea[3]],
                    [this.exportArea[2], height - this.exportArea[1]],
                ]]);
                this.layer.getSource().addFeature(new ol.Feature({geometry: geometry}));
            }
        },
        handleModifyend: function (e) {
            this.updateExportArea(e.features.item(0));
        },
        clearSource: function () {
            this.layer.getSource().clear();
        },
        handleDrawend: function (e) {
            var source = this.layer.getSource();
            var oldFeature = source.getFeatures()[0];
            source.clear();
            // Remove the feature again if creating it failed.
            this.updateExportArea(e.feature).catch(function () {
                source.clear();
                if (oldFeature) {
                    source.addFeature(oldFeature);
                }
            });
        },
        updateExportArea: function (feature) {
            var self = this;
            var coordinates = feature.getGeometry().getCoordinates()[0];
            // Handle coordinates for tiled and regular images differently.
            var height = this.currentImage.tiled ? 0 : this.height;
            coordinates = [
                coordinates[0][0], height - coordinates[0][1],
                coordinates[2][0], height - coordinates[2][1],
            ].map(Math.round);

            var promise = this.exportAreaApi.save({id: this.volumeId}, {coordinates: coordinates})
                .then(function () {
                    self.exportArea = coordinates;
                });

            promise.catch(this.messages.handleErrorResponse);

            return promise;
        },
    },
    watch: {
        opacity: function (opacity, oldOpacity) {
            if (opacity < 1) {
                this.settings.set('exportAreaOpacity', opacity);
            } else {
                this.settings.delete('exportAreaOpacity');
            }

            this.layer.setOpacity(opacity);
        },
        exportArea: function () {
            this.maybeDrawArea();
        },
        height: function () {
            this.maybeDrawArea();
        },
    },
    created: function () {
        if (this.settings.has('exportAreaOpacity')) {
            this.opacityValue = this.settings.get('exportAreaOpacity');
        }

        this.exportArea = biigle.$require('annotations.exportArea');

        var events = biigle.$require('events');
        events.$on('images.change', this.updateCurrentImage);

        var map = biigle.$require('annotations.stores.map');
        map.addLayer(this.layer);
        this.drawInteraction.setActive(false);
        map.addInteraction(this.drawInteraction);
        this.modifyInteraction.setActive(false);
        map.addInteraction(this.modifyInteraction);

        this.drawInteraction.on('drawend', this.handleDrawend);
        this.modifyInteraction.on('modifyend', this.handleModifyend);
    },
};
