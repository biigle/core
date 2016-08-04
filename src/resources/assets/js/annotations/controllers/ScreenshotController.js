/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name ScreenshotController
 * @memberOf dias.annotations
 * @description Manages the "get screenshot" button
 */
angular.module('dias.annotations').controller('ScreenshotController', function ($scope, map, images) {
		"use strict";
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
            map.once('postcompose', function (e) {
                getBlob(e.context.canvas, download);
            });
            map.renderSync();
        };
	}
);
