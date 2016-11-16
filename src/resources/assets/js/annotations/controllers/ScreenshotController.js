/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name ScreenshotController
 * @memberOf dias.annotations
 * @description Manages the "get screenshot" button
 */
angular.module('dias.annotations').controller('ScreenshotController', function ($scope, map, images) {
		"use strict";
        var screenshotsSupported = true;

        var getFilename = function () {
            if (images.currentImage) {
                var name = images.currentImage._filename.split('.');
                if (name.length > 1) {
                    name[name.length - 1] = 'png';
                }
                name = name.join('.').toLowerCase();
                return 'dias_screenshot_' + name;
            }

            return 'dias_screenshot.png';
        };

        // see: https://gist.github.com/remy/784508
        var trim = function (c) {
            var ctx = c.getContext('2d');
            var copy = document.createElement('canvas').getContext('2d');
            var pixels = ctx.getImageData(0, 0, c.width, c.height);
            var l = pixels.data.length;
            var i, x, y;
            var bound = {
                top: null,
                left: null,
                right: null,
                bottom: null
            };

            for (i = 0; i < l; i += 4) {
                if (pixels.data[i + 3] !== 0) {
                    x = (i / 4) % c.width;
                    y = ~~((i / 4) / c.width);

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

            var trimHeight = bound.bottom - bound.top;
            var trimWidth = bound.right - bound.left;
            var trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight);

            copy.canvas.width = trimWidth;
            copy.canvas.height = trimHeight;
            copy.putImageData(trimmed, 0, 0);

            return copy.canvas;
        };

        var getBlob = function (canvas, callback) {
            var type = 'image/png';
            if (!HTMLCanvasElement.prototype.toBlob) {
                // fallback if toBlob is not implemented see 'Polyfill':
                // https://developer.mozilla.org/de/docs/Web/API/HTMLCanvasElement/toBlob
                var binStr = atob(canvas.toDataURL(type).split(',')[1]);
                var len = binStr.length;
                var arr = new Uint8Array(len);
                for (var i = 0; i < len; i++ ) {
                    arr[i] = binStr.charCodeAt(i);
                }

                callback(new Blob([arr], {type: type}));
            } else {
                canvas.toBlob(callback, type);
            }
        };

        var download = function (blob) {
            var a = document.createElement('a');
            a.style = 'display: none';
            a.download = getFilename();
            a.href = URL.createObjectURL(blob);
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                // wait a bit before revoking the blob (else the download might not work)
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
            }, 100);
        };

        $scope.makeShot = function () {
            if (screenshotsSupported) {
                map.once('postcompose', function (e) {
                    getBlob(trim(e.context.canvas), download);
                });
                map.renderSync();
            }
        };

        $scope.screenshotsSupported = function () {
            return screenshotsSupported;
        };

        var cancelListener = $scope.$on('image.shown', function (e, image) {
            // Perform this check only for the first image.
            cancelListener();
            var ctx = document.createElement('canvas').getContext('2d');
            // Check if the image comes from a cross origin without CORS
            ctx.drawImage(image, 0, 0);

            try {
                ctx.getImageData(0, 0, 1, 1);
            } catch (err) {
                if (err.code === 18) {
                    screenshotsSupported = false;
                }
            }
        });
	}
);
