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

class ScaleLineProperties
{
    #targetWidth = 100;
    #leadingDigits = [1, 2, 5];
    #resolution;
    #hasArea;
    #pxWidthInMeter;
    #unitMultipliers;
    #unitNames;
    
    constructor(resolution, hasArea, pxWidthInMeter, unitMultipliers, unitNames) {
        this.#resolution = resolution;
        this.#hasArea = hasArea;
        this.#pxWidthInMeter = pxWidthInMeter;
        this.#unitMultipliers = unitMultipliers;
        this.#unitNames = unitNames;
    }
    
    #scale() {
        return this.#targetWidth * this.#scaleMultiplier();
    }
    
    #scalePowerOfTen() {
        return powerOfTen(this.#scale());
    }
    
    #scaleMultiplier() {
        if(this.#hasArea) {
            return this.#resolution * this.#pxWidthInMeter;
        }
        
        return this.#resolution || 0;
    }
    
    #scaleNearest() {
        let smallestIndex = 0;
        let smallestDistance = Infinity;
        for (let i = this.#leadingDigits.length - 1; i >= 0; i--) {
            let check = this.#leadingDigits[i] * this.#scalePowerOfTen();
            if (Math.abs(this.#scale() - check) < smallestDistance) {
                smallestIndex = i;
                smallestDistance = Math.abs(this.#scale() - check);
            }
        }

        return this.#leadingDigits[smallestIndex] * this.#scalePowerOfTen();
    }
    
    #unitNearest() {
        let smallestIndex = 0;
        let smallestDistance = Infinity;
        for (let i = this.#unitMultipliers.length - 1; i >= 0; i--) {
            if (Math.abs(this.#unitMultipliers[i] - this.#scalePowerOfTen()) < smallestDistance) {
                smallestIndex = i;
                smallestDistance = Math.abs(this.#unitMultipliers[i] - this.#scalePowerOfTen());
            }
        }

        return smallestIndex;
    }
    
    width() {
        return Math.round(this.#scaleNearest() / this.#scaleMultiplier());
    }
    
    text() {
        if (this.#hasArea) {
            const unitNearest = this.#unitNearest();
            return Math.round(this.#scaleNearest() / this.#unitMultipliers[unitNearest]) + ' ' + this.#unitNames[unitNearest];
        }

        return Math.round(this.#scaleNearest()) + ' px';
    }
}

export {isInvalidShape, clamp, trimCanvas, ScaleLineProperties};
