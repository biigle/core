import Feature from '@biigle/ol/Feature';
import LineString from '@biigle/ol/geom/LineString';
import { rightClick } from '@/annotations/ol/events/condition.js';
import { noModifierKeys } from '@biigle/ol/events/condition';
import { DragPan } from '@biigle/ol/interaction';

/**
 * This function checks for invalid annotation shapes.
 *
 * @param feature containing the video annotation to check
 * @returns true, if a video annotation has an invalid shape, otherwise false.
 *
 *
 **/
let isInvalidShape = function (feature) {
    let geometry = feature.getGeometry();
    let points = [];
    switch (geometry.getType()) {
        case 'Circle':
            return parseInt(geometry.getRadius()) === 0;
        case 'LineString':
            points = geometry.getCoordinates();
            return (new Set(points.map(xy => String([xy])))).size < 2;
        case 'Rectangle':
        case 'Ellipse':
            points = geometry.getCoordinates()[0];
            return (new Set(points.map(xy => String([xy])))).size !== 4;
        case 'Polygon':
            points = geometry.getCoordinates()[0];
            return (new Set(points.map(xy => String([xy])))).size < 3;
        default:
            return false;
    }
};

/**
 * Clamps a value in an inclusive interval
 * @param value The value to clamp
 * @param min Lower bound
 * @param max Upper bound
 * @returns Lower or upper bound if the value is outside of the bounds, otherwise just the value
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function trimCanvas(canvas) {
    let ctx = canvas.getContext('2d');
    let topLeft = ctx.getImageData(0, 0, 1, 1);
    let bottomRight = ctx.getImageData(canvas.width - 1, canvas.height - 1, 1, 1);
    if (topLeft.data[3] !== 0 && bottomRight.data[3] !== 0) {
        return canvas;
    }
    let copy = document.createElement('canvas').getContext('2d');
    let pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let l = pixels.data.length;
    let i, x, y;
    let bound = {
        top: null,
        left: null,
        right: null,
        bottom: null
    };

    for (i = 0; i < l; i += 4) {
        if (pixels.data[i + 3] !== 0) {
            x = (i / 4) % canvas.width;
            y = ~~((i / 4) / canvas.width);

            if (bound.top === null) {
                bound.top = y;
            }

            if (bound.left === null) {
                bound.left = x;
            } else if (x < bound.left) {
                bound.left = x;
            }

            if (bound.right === null) {
                bound.right = x;
            } else if (bound.right < x) {
                bound.right = x;
            }

            if (bound.bottom === null) {
                bound.bottom = y;
            } else if (bound.bottom < y) {
                bound.bottom = y;
            }
        }
    }

    let trimHeight = bound.bottom - bound.top;
    let trimWidth = bound.right - bound.left;
    let trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight);

    copy.canvas.width = trimWidth;
    copy.canvas.height = trimHeight;
    copy.putImageData(trimmed, 0, 0);

    return copy.canvas;
}

function powerOfTen(value) {
    return Math.pow(10, Math.floor(Math.log10(value)));
}

const UnitMultipliers = [1e+3, 1, 1e-2, 1e-3, 1e-6, 1e-9];
const UnitNames = ['km', 'm', 'cm', 'mm', 'µm', 'nm'];

class ScaleLineProperties {
    constructor(resolution, hasArea, pxWidthInMeter, fixedUnit) {
        this._resolution = resolution;
        this._hasArea = hasArea;
        this._pxWidthInMeter = pxWidthInMeter;

        if (fixedUnit && UnitNames.indexOf(fixedUnit) !== -1) {
            this._fixedUnitIndex = UnitNames.indexOf(fixedUnit);
        } else {
            this._fixedUnitIndex = null;
        }

        this._targetWidth = 100;
        this._leadingDigits = [1, 2, 5];
    }

    _scale() {
        return this._targetWidth * this._scaleMultiplier();
    }

    _scalePowerOfTen() {
        return powerOfTen(this._scale());
    }

    _scaleMultiplier() {
        if (this._hasArea) {
            return this._resolution * this._pxWidthInMeter;
        }

        return this._resolution || 0;
    }

    _scaleNearest() {
        let smallestIndex = 0;
        let smallestDistance = Infinity;
        for (let i = this._leadingDigits.length - 1; i >= 0; i--) {
            let check = this._leadingDigits[i] * this._scalePowerOfTen();
            if (Math.abs(this._scale() - check) < smallestDistance) {
                smallestIndex = i;
                smallestDistance = Math.abs(this._scale() - check);
            }
        }

        return this._leadingDigits[smallestIndex] * this._scalePowerOfTen();
    }

    _unitNearest() {
        if (this._fixedUnitIndex !== null) {
            return this._fixedUnitIndex;
        }

        let smallestIndex = 0;
        let smallestDistance = Infinity;
        for (let i = UnitMultipliers.length - 1; i >= 0; i--) {
            if (Math.abs(UnitMultipliers[i] - this._scalePowerOfTen()) < smallestDistance) {
                smallestIndex = i;
                smallestDistance = Math.abs(UnitMultipliers[i] - this._scalePowerOfTen());
            }
        }

        return smallestIndex;
    }

    _formatValue(value) {
        return new Intl.NumberFormat("en-US").format(value);
    }

    width() {
        return Math.round(this._scaleNearest() / this._scaleMultiplier());
    }

    text() {
        if (this._hasArea) {
            const unitNearest = this._unitNearest();
            const length = this._scaleNearest() / UnitMultipliers[unitNearest];
            return this._formatValue(length) + ' ' + UnitNames[unitNearest];
        }

        return this._formatValue(this._scaleNearest()) + ' px';
    }
}

/**
 * Adds right click panning with the given condition to the map. Prevents right click for opening the context menu. 
 * 
 * @param map The ol map used for displaying videos/images
 * @param condition Condition for enabling right click panning
 */
function addRightClickDragPanToMap(map, condition) {
    map.addInteraction(new DragPan({
        condition: (mapBrowserEvent) => {
            return rightClick(mapBrowserEvent) && noModifierKeys(mapBrowserEvent) && condition();
        }
    }));

    map.getViewport().addEventListener('contextmenu', (e) => {
        if (condition()) {
            e.preventDefault();
        }
    });
}

export { isInvalidShape, clamp, trimCanvas, ScaleLineProperties, UnitMultipliers, UnitNames, addRightClickDragPanToMap };

export const LABEL_TOOLTIP_MODES = Object.freeze({
    OFF: 'off',
    HOVER: 'hover',
    ALWAYS: 'always',
});

export function normalizeLabelTooltipMode(value) {
    if (value === true || value === 'true' || value === LABEL_TOOLTIP_MODES.HOVER) {
        return LABEL_TOOLTIP_MODES.HOVER;
    }

    if (value === LABEL_TOOLTIP_MODES.ALWAYS) {
        return LABEL_TOOLTIP_MODES.ALWAYS;
    }

    return LABEL_TOOLTIP_MODES.OFF;
}

export function shouldShowPersistentLabelTooltips(mode, playing = false) {
    return mode === LABEL_TOOLTIP_MODES.ALWAYS && !playing;
}

export function getInitialAnnotationOverlayPlacement(
    annotationExtent,
    viewportExtent,
    resolution,
    tooltipSize,
    gap = 15,
    centered = false
) {
    const centerY = (annotationExtent[1] + annotationExtent[3]) / 2;
    const rightSpace = (viewportExtent[2] - annotationExtent[2]) / resolution;
    const horizontalWidth = centered ? tooltipSize[0] / 2 : tooltipSize[0];
    const useRightSide = rightSpace >= horizontalWidth + gap;
    const position = useRightSide
        ? [annotationExtent[2], centerY]
        : [annotationExtent[0], centerY];
    const positioning = centered ? 'center-center' : (useRightSide ? 'center-left' : 'center-right');
    const offset = [useRightSide ? gap : -gap, 0];
    // Preserve the LabelBOT fallback for annotations spanning the viewport.
    if (centered && (position[0] - viewportExtent[0]) / resolution < horizontalWidth + gap) {
        offset[0] = gap;
    }
    const bottomOverflow = (viewportExtent[1] - centerY) / resolution + tooltipSize[1] / 2;
    const topOverflow = tooltipSize[1] / 2 - (viewportExtent[3] - centerY) / resolution;

    if (bottomOverflow > 0) {
        offset[1] = -bottomOverflow;
    } else if (topOverflow > 0) {
        offset[1] = topOverflow;
    }

    return {position, positioning, offset};
}

/** Update the screen-space offset while an annotation overlay is dragged. */
export function dragAnnotationOverlay(overlay, startOffset, startPosition, event) {
    overlay.setOffset([
        startOffset[0] + event.clientX - startPosition[0],
        startOffset[1] + event.clientY - startPosition[1],
    ]);
}

/** Anchor a dragged overlay without changing its screen position. */
export function anchorAnnotationOverlay(overlay, map) {
    const position = overlay.getPosition();
    const offset = overlay.getOffset();
    const resolution = map.getView().getResolution();
    const realPosition = [position[0] + offset[0] * resolution, position[1] - offset[1] * resolution];
    const newPosition = overlay._annotationGeometry.getClosestPoint(realPosition);
    overlay.setPosition(newPosition);
    overlay.setOffset([
        (realPosition[0] - newPosition[0]) / resolution,
        (newPosition[1] - realPosition[1]) / resolution,
    ]);
}

/** Create the connector shared by LabelBOT and persistent label tooltips. */
export function createAnnotationOverlayConnector(overlay, map, color, style, shouldUpdate = () => true) {
    const position = overlay.getPosition();
    const line = new LineString([position, position]);
    const feature = new Feature(line);
    feature.set('unselectable', true);
    feature.set('color', color);
    feature.setStyle(style);
    feature._updateCoordinates = () => {
        if (!shouldUpdate()) return;

        const position = overlay.getPosition();
        const offset = overlay.getOffset();
        const resolution = map.getView().getResolution();
        const end = [position[0] + offset[0] * resolution, position[1] - offset[1] * resolution];
        const start = overlay._annotationGeometry.getClosestPoint(end);
        line.setCoordinates([start, end]);
    };
    feature._updateCoordinates();

    return feature;
}
