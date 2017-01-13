/**
 * @namespace biigle.annotations
 * @ngdoc service
 * @name exportArea
 * @memberOf biigle.annotations
 * @description Manages the export area drawn on the map
 */
angular.module('biigle.annotations').service('exportArea', function (map, styles, ExportArea, VOLUME_ID, EXPORT_AREA, msg) {
        "use strict";

        // a circle with a red and white stroke
        var style = [
            new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: styles.colors.white,
                    width: 4
                }),
                image: new ol.style.Circle({
                    radius: 6,
                    fill: new ol.style.Fill({
                        color: '#666666'
                    }),
                    stroke: new ol.style.Stroke({
                        color: styles.colors.white,
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
        ];
        var height;
        var area;

        var editing = false;

        var collection = new ol.Collection();
        var source = new ol.source.Vector({
            features: collection
        });
        var layer = new ol.layer.Vector({
            source: source,
            style: style,
            zIndex: 4,
            updateWhileAnimating: true,
            updateWhileInteracting: true
        });
        map.addLayer(layer);

        var draw = new ol.interaction.Draw({
            source: source,
            type: 'Rectangle',
            style: style,
            minPoints: 2,
            maxPoints: 2,
            geometryFunction: function (coordinates, opt_geometry) {
                coordinates = coordinates[0];
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

        draw.on('drawend', function (e) {
            if (area) {
                source.removeFeature(area);
            }

            saveArea(e.feature).then(function () {
                area = e.feature;
            }).catch(function () {
                source.removeFeature(e.feature);
                if (area) {
                    source.addFeature(area);
                }
            });
        });

        var modify = new ol.interaction.Modify({
            features: collection,
            style: style,
            deleteCondition: ol.events.condition.never
        });

        var deleteArea = function () {
            if (!area) {
                return;
            }

            source.removeFeature(area);
            ExportArea.delete({volume_id: VOLUME_ID}, function () {
                area = undefined;
            }, function (response) {
                source.addFeature(area);
                msg.responseError(response);
            });
        };

        var saveArea = function (feature) {
            var coordinates = fromOlCoordinates(feature.getGeometry().getCoordinates());

            return ExportArea.save({volume_id: VOLUME_ID}, {
                coordinates: coordinates
            }, function () {
                EXPORT_AREA = coordinates;
            }, msg.responseError).$promise;
        };

        modify.on('modifyend', function () {
            if (area) {
                saveArea(area);
            }
        });

        var toOlCoordinates = function (cooridnates) {
            return [
                // swap y coordinates for OpenLayers
                [cooridnates[0], height - cooridnates[1]],
                [cooridnates[0], height - cooridnates[3]],
                [cooridnates[2], height - cooridnates[3]],
                [cooridnates[2], height - cooridnates[1]],
            ];
        };

        var fromOlCoordinates = function (coordinates) {
            coordinates = coordinates[0];
            coordinates = [
                coordinates[0][0], height - coordinates[0][1],
                coordinates[2][0], height - coordinates[2][1],
            ];

            return coordinates.map(Math.round);
        };

        var update = function () {
            if (!EXPORT_AREA || EXPORT_AREA.length !== 4) {
                return;
            }

            var geometry = new ol.geom.Rectangle([
                toOlCoordinates(EXPORT_AREA)
            ]);
            if (!area) {
                area = new ol.Feature({geometry: geometry});
                source.addFeature(area);
            } else {
                area.setGeometry(geometry);
            }
        };

        this.updateHeight = function (e, image) {
            if (height !== image.height) {
                height = image.height;
                update();
            }
        };

        this.toggleEdit = function () {
            if (!editing) {
                map.addInteraction(draw);
                map.addInteraction(modify);
            } else {
                map.removeInteraction(draw);
                map.removeInteraction(modify);
            }

            editing = !editing;
        };

        this.isEditing = function () {
            return editing;
        };

        this.setOpacity = function (o) {
            layer.setOpacity(o);
        };

        this.deleteArea = deleteArea;

        this.hasArea = function () {
            return !!area;
        };
    }
);
