/**
 * Store for the styles of OpenLayers features (annotations)
 */
biigle.$declare('annotations.stores.styles', function () {
    var colors = {
        white: [255, 255, 255, 1],
        blue: [0, 153, 255, 1],
        orange: '#ff5e00',
    };

    var defaultCircleRadius = 6;
    var defaultStrokeWidth = 3;

    var defaultStrokeOutline = new ol.style.Stroke({
        color: colors.white,
        width: 5
    });

    var selectedStrokeOutline = new ol.style.Stroke({
        color: colors.white,
        width: 6
    });

    var defaultStroke = new ol.style.Stroke({
        color: colors.blue,
        width: defaultStrokeWidth
    });

    var selectedStroke = new ol.style.Stroke({
        color: colors.orange,
        width: defaultStrokeWidth
    });

    var defaultCircleFill = new ol.style.Fill({
        color: colors.blue
    });

    var selectedCircleFill = new ol.style.Fill({
        color: colors.orange
    });

    var defaultCircleStroke = new ol.style.Stroke({
        color: colors.white,
        width: 2
    });

    var selectedCircleStroke = new ol.style.Stroke({
        color: colors.white,
        width: defaultStrokeWidth
    });

    var editingCircleStroke = new ol.style.Stroke({
        color: colors.white,
        width: 2,
        lineDash: [3]
    });

    var editingStroke = new ol.style.Stroke({
        color: colors.blue,
        width: defaultStrokeWidth,
        lineDash: [5]
    });

    var defaultFill = new ol.style.Fill({
        color: colors.blue
    });

    var selectedFill = new ol.style.Fill({
        color: colors.orange
    });

    return {
        colors: colors,
        features: function (feature) {
            var color = feature.get('color');
            color = color ? ('#' + color) : colors.blue;
            return [
                new ol.style.Style({
                    stroke: defaultStrokeOutline,
                    image: new ol.style.Circle({
                        radius: defaultCircleRadius,
                        fill: new ol.style.Fill({
                            color: color
                        }),
                        stroke: defaultCircleStroke
                    })
                }),
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: color,
                        width: 3
                    })
                }),
            ];
        },
        highlight: [
            new ol.style.Style({
                stroke: selectedStrokeOutline,
                image: new ol.style.Circle({
                    radius: defaultCircleRadius,
                    fill: selectedCircleFill,
                    stroke: selectedCircleStroke
                }),
                zIndex: 200
            }),
            new ol.style.Style({
                stroke: selectedStroke,
                zIndex: 200
            }),
        ],
        editing: [
            new ol.style.Style({
                stroke: defaultStrokeOutline,
                image: new ol.style.Circle({
                    radius: defaultCircleRadius,
                    fill: defaultCircleFill,
                    stroke: editingCircleStroke
                })
            }),
            new ol.style.Style({
                stroke: editingStroke
            }),
        ],
        viewport: [
            new ol.style.Style({
                stroke: defaultStroke,
            }),
            new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: colors.white,
                    width: 1
                })
            })
        ],
    };
});
