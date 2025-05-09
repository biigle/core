import Circle from '@biigle/ol/style/Circle';
import Fill from '@biigle/ol/style/Fill';
import RegularShape from '@biigle/ol/style/RegularShape';
import Stroke from '@biigle/ol/style/Stroke';
import Style from '@biigle/ol/style/Style';

/**
 * Store for the styles of OpenLayers features (annotations)
 */
let colors = {
    white: [255, 255, 255, 1],
    blue: [0, 153, 255, 1],
    orange: '#ff5e00',
};

// Cache for the features style (where each feature may have a distinct color).
// If these were not cached the style for each feature would be recreated for each
// render call, resulting in a huge amount of new memory allocations and very
// noticeable garbage collection interrupts.
let styleCache = {};

let defaultCircleRadius = 6;
let defaultStrokeWidth = 3;

let defaultStrokeOutline = new Stroke({
    color: colors.white,
    width: 5,
});

let selectedStrokeOutline = new Stroke({
    color: colors.white,
    width: 6,
});

let defaultStroke = new Stroke({
    color: colors.blue,
    width: defaultStrokeWidth,
});

let selectedStroke = new Stroke({
    color: colors.orange,
    width: defaultStrokeWidth,
});

let defaultCircleFill = new Fill({
    color: colors.blue,
});

let selectedCircleFill = new Fill({
    color: colors.orange,
});

let transparentFill =  new Fill({
    color: 'transparent',
});

let defaultCircleStroke = new Stroke({
    color: colors.white,
    width: 2
});

let selectedCircleStroke = new Stroke({
    color: colors.white,
    width: defaultStrokeWidth,
});

let editingCircleStroke = new Stroke({
    color: colors.white,
    width: 2,
    lineDash: [3],
});

let editingStroke = new Stroke({
    color: colors.blue,
    width: defaultStrokeWidth,
    lineDash: [5],
});

export default {
    colors: colors,
    features(feature) {
        let color = feature.get('color');
        color = color ? ('#' + color) : colors.blue;

        if (!styleCache.hasOwnProperty(color)) {
            styleCache[color] = [
                new Style({
                    stroke: defaultStrokeOutline,
                    image: new Circle({
                        radius: defaultCircleRadius,
                        fill: new Fill({
                            color: color,
                        }),
                        stroke: defaultCircleStroke,
                    }),
                    // Add transparent fill for hit detection inside of circles and
                    // polygons.
                    // See https://github.com/openlayers/openlayers/pull/7750
                    fill: transparentFill,
                }),
                new Style({
                    stroke: new Stroke({
                        color: color,
                        width: 3,
                    }),
                }),
            ];
        }

        return styleCache[color];
    },
    highlight: [
        new Style({
            stroke: selectedStrokeOutline,
            image: new Circle({
                radius: defaultCircleRadius,
                fill: selectedCircleFill,
                stroke: selectedCircleStroke,
            }),
            // Add transparent fill for hit detection inside of circles and
            // polygons.
            // See https://github.com/openlayers/openlayers/pull/7750
            fill: transparentFill,
            zIndex: 200,
        }),
        new Style({
            stroke: selectedStroke,
            zIndex: 200,
        }),
    ],
    editing: [
        new Style({
            stroke: defaultStrokeOutline,
            image: new Circle({
                radius: defaultCircleRadius,
                fill: defaultCircleFill,
                stroke: editingCircleStroke,
            }),
            // Also for hit detection (see above) in some scenarios (e.g. biigle/maia).
            fill: transparentFill,
        }),
        new Style({
            stroke: editingStroke,
        }),
    ],
    viewport: [
        new Style({
            stroke: defaultStroke,
        }),
        new Style({
            stroke: new Stroke({
                color: colors.white,
                width: 1,
            }),
        }),
    ],
    cross: [
        new Style({
            image: new RegularShape({
                stroke: selectedStrokeOutline,
                points: 4,
                radius: 6,
                radius2: 0,
                angle: Math.PI / 4,
            }),
        }),
        new Style({
            image: new RegularShape({
                stroke: selectedStroke,
                points: 4,
                radius: 6,
                radius2: 0,
                angle: Math.PI / 4,
            }),
        }),
    ],
};
