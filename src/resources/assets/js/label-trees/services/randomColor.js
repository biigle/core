/**
 * @namespace biigle.ate
 * @ngdoc service
 * @name rancomColor
 * @memberOf biigle.label-trees
 * @description Provides a machanism for random colors
 */
angular.module('biigle.label-trees').service('randomColor', function () {
        "use strict";

        // HSV values
        var MIN = [0, 0.5, 0.9];
        var MAX = [360, 1, 1];

        // number of decimals to keep
        var PRECISION = [0, 2, 2];

        // see https://de.wikipedia.org/wiki/HSV-Farbraum#Transformation_von_RGB_und_HSV.2FHSL
        var toRgb = function (hsv) {

            var tmp = hsv[0] / 60;
            var hi = Math.floor(tmp);
            var f = tmp - hi;
            var pqt = [
                hsv[2] * (1 - hsv[1]),
                hsv[2] * (1 - hsv[1] * f),
                hsv[2] * (1 - hsv[1] * (1 - f))
            ];

            var rgb;

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

        var toHex = function (rgb) {
            return rgb.map(function (item) {
                item = item.toString(16);
                return (item.length === 1) ? ('0' + item) : item;
            });
        };

        this.get = function () {
            var color = [0, 0, 0];
            var precision;
            for (var i = color.length - 1; i >= 0; i--) {
                precision = 10 * PRECISION[i];
                color[i] = (MAX[i] - MIN[i]) * Math.random() + MIN[i];
                if (precision !== 0) {
                    color[i] = Math.round(color[i] * precision) / precision;
                } else {
                    color[i] = Math.round(color[i]);
                }
            }

            return '#' + toHex(toRgb(color)).join('');
        };
    }
);
