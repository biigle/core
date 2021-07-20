/**
 * This function is used to round key frame times of video annotations to the current
 * precision of the video. Some browsers seem to output a different precision for the
 * currentTime of the video, so the annotation could have more decimals than the value
 * returned by currentTime. The key frame time must be rounded for all checks comparing
 * the times.
 *
 * @param {float} reference
 *
 * @return {function} Function that rounds a given number to the precision of the refernece.
 */
let getRoundToPrecision = function (reference) {
    let decimals = reference.toString().split('.')[1];
    const precision = decimals ? decimals.length : 0;

    return function (number) {
        return Math.round(number * Math.pow(10, precision)) / Math.pow(10, precision);
    };
};

export {getRoundToPrecision};
