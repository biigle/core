/**
 * Function returning a random color
 */
// HSV values
let MIN = [0, 0.5, 0.9];
let MAX = [360, 1, 1];

// number of decimals to keep
let PRECISION = [0, 2, 2];

// see https://de.wikipedia.org/wiki/HSV-Farbraum#Transformation_von_RGB_und_HSV.2FHSL
let hsvToRgb = function (hsv) {
    let tmp = hsv[0] / 60;
    let hi = Math.floor(tmp);
    let f = tmp - hi;
    let pqt = [
        hsv[2] * (1 - hsv[1]),
        hsv[2] * (1 - hsv[1] * f),
        hsv[2] * (1 - hsv[1] * (1 - f))
    ];

    let rgb;

    switch (hi) {
        case 1:
            rgb = [pqt[1], hsv[2], pqt[0]];
            break;
        case 2:
            rgb = [pqt[0], hsv[2], pqt[2]];
            break;
        case 3:
            rgb = [pqt[0], pqt[1], hsv[2]];
            break;
        case 4:
            rgb = [pqt[2], pqt[0], hsv[2]];
            break;
        case 5:
            rgb = [hsv[2], pqt[0], pqt[1]];
            break;
        default:
            rgb = [hsv[2], pqt[2], pqt[0]];
    }

    return rgb.map(function(item) {
        return Math.round(item * 255);
    });
};

let rgbToHex = function (rgb) {
    return rgb.map(function (item) {
        item = item.toString(16);
        return (item.length === 1) ? ('0' + item) : item;
    });
};

let randomColor = function () {
    let color = [0, 0, 0];
    let precision;
    for (let i = color.length - 1; i >= 0; i--) {
        precision = 10 * PRECISION[i];
        color[i] = (MAX[i] - MIN[i]) * Math.random() + MIN[i];
        if (precision !== 0) {
            color[i] = Math.round(color[i] * precision) / precision;
        } else {
            color[i] = Math.round(color[i]);
        }
    }

    return '#' + rgbToHex(hsvToRgb(color)).join('');
};

export {randomColor};
