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

class ScaleLineProperties
{
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
        return new Intl.NumberFormat("en-US", {
            maximumSignificantDigits: 3
        }).format(value);
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

export {isInvalidShape, clamp, trimCanvas, ScaleLineProperties, UnitMultipliers, UnitNames};
