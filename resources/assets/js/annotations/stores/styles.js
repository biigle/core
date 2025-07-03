import Circle from '@biigle/ol/style/Circle';
import Fill from '@biigle/ol/style/Fill';
import RegularShape from '@biigle/ol/style/RegularShape';
import Stroke from '@biigle/ol/style/Stroke';
import Style from '@biigle/ol/style/Style';

/**
 * Store for the styles of OpenLayers features (annotations)
 */
const colors = {
    white: [255, 255, 255, 1],
    blue: [0, 153, 255, 1],
    orange: '#ff5e00',
};

// Cache for the features style (where each feature may have a distinct color).
// If these were not cached the style for each feature would be recreated for each
// render call, resulting in a huge amount of new memory allocations and very
// noticeable garbage collection interrupts.
const styleCache = {
    features: {},
    editing: {},
};

const defaultCircleRadius = 6;
const defaultStrokeWidth = 3;

const defaultStrokeOutline = new Stroke({
    color: colors.white,
    width: 5,
});

const selectedStrokeOutline = new Stroke({
    color: colors.white,
    width: 9,
});

const selectedStroke = new Stroke({
    color: colors.orange,
    width: defaultStrokeWidth,
});

const transparentFill =  new Fill({
    color: 'transparent',
});

const defaultCircleStroke = new Stroke({
    color: colors.white,
    width: 2
});

const selectedCircleStroke = new Stroke({
    color: colors.white,
    width: 6,
});

// Define this here even though it seems to be used only once but actually it can be
// reused multiple times with different editing styles (colors).
const editingCircleStroke = new Stroke({
    color: colors.white,
    width: 2,
    lineDash: [3],
});

export default {
    colors: colors,
    features(feature) {
        let color = feature.get('color');
        color = color ? ('#' + color) : colors.blue;

        if (!styleCache.features.hasOwnProperty(color)) {
            styleCache.features[color] = [
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

        return styleCache.features[color];
    },
    highlight: [
        new Style({
            stroke: selectedStrokeOutline,
            image: new Circle({
                radius: defaultCircleRadius,
                stroke: new Stroke({
                    color: colors.white,
                    width: 6,
                }),
            }),
            // Add transparent fill for hit detection inside of circles and
            // polygons.
            // See https://github.com/openlayers/openlayers/pull/7750
            fill: transparentFill,
            zIndex: 200,
        }),
        new Style({
            stroke: selectedStroke,
            image: new Circle({
                radius: defaultCircleRadius,
                fill: new Fill({
                    color: colors.orange,
                }),
                stroke: defaultCircleStroke,
            }),
            zIndex: 200,
        }),
    ],
    viewport: [
        new Style({
            stroke: new Stroke({
                color: colors.blue,
                width: defaultStrokeWidth,
            }),
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
    editing(feature) {
        let color = feature.get('color');
        color = color ? ('#' + color) : colors.blue;

        if (!styleCache.editing.hasOwnProperty(color)) {
            styleCache.editing[color] = [
                new Style({
                    stroke: defaultStrokeOutline,
                    image: new Circle({
                        radius: defaultCircleRadius,
                        fill: new Fill({
                            color: color,
                        }),
                        stroke: editingCircleStroke,
                    }),
                    // Also for hit detection (see above) in some scenarios (e.g. biigle/maia).
                    fill: transparentFill,
                    zIndex: 100,
                }),
                new Style({
                    stroke: new Stroke({
                        color: color,
                        width: defaultStrokeWidth,
                        lineDash: [5],
                    }),
                    zIndex: 100,
                }),
            ];
        }

        return styleCache.editing[color];
    }
}
