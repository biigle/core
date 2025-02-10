/**
 * This function is used to round key frame times of video annotations to the current
 * precision of the video. Some browsers seem to output a different precision for the
 * currentTime of the video, so the annotation could have more decimals than the value
 * returned by currentTime. The key frame time must be rounded for all checks comparing
 * the times.
 *
 * Also, sometimes the video currentTime is not set to the exact time of the annotation
 * (maybe if the annotation was created in a different browser). Hence, we round  both
 * the video currentTime and the annotation frame times to a maximum of 4 decimals when
 * an annotation is checked if it should be displayed in a frame.
 *
 * @param {float} reference
 *
 * @return {function} Function that rounds a given number to the precision of the refernece.
 */
let getRoundToPrecision = function (reference) {
    let decimals = reference.toString().split('.')[1];
    // Cut precision to a maximum of 4 decimals.
    const precision = decimals ? Math.min(decimals.length, 4) : 0;

    return function (number) {
        return Math.round(number * Math.pow(10, precision)) / Math.pow(10, precision);
    };
};

export { getRoundToPrecision };
