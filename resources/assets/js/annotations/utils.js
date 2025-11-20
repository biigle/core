/**
 * This function checks for invalid annotation shapes.
 * 
 * @param feature containing the video annotation to check
 * @returns true, if a video annotation has an invalid shape, otherwise false.
 * 
 * **/
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

function getBoundingBox(image, points) {
    let minX = image.width;
    let minY = image.height;
    let maxX = 0;
    let maxY = 0;
    // Point
    if (points.length === 2) {
        // TODO: maybe use SAM or PTP module to convert point to shape
        const tempRadius = 64; // Same radius than used for Largo thumbnails.
        const [x, y] = points;
        minX = Math.max(0, x - tempRadius);
        minY = Math.max(0, y - tempRadius);
        maxX = Math.min(image.width, x + tempRadius);
        maxY = Math.min(image.height, y + tempRadius);
    } else if (points.length === 3) { // Circle
        const [centerX, centerY, radius] = points;
        minX = Math.max(0, centerX - radius);
        minY = Math.max(0, centerY - radius);
        maxX = Math.min(image.width, centerX + radius);
        maxY = Math.min(image.height, centerY + radius);
    } else {
        for (let i = 0; i < points.length; i += 2) {
            const x = points[i];
            const y = points[i + 1];
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
        // Ensure the bounding box is within the image dimensions
        minX = Math.max(0, minX);
        minY = Math.max(0, minY);
        maxX = Math.min(image.width, maxX);
        maxY = Math.min(image.height, maxY);
    }

    const width = maxX - minX;
    const height = maxY - minY;

    return [minX, minY, width, height];
}

export {isInvalidShape, clamp, getBoundingBox};