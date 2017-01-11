/**
 * @namespace biigle.annotations
 * @ngdoc service
 * @name mapImage
 * @memberOf biigle.annotations
 * @description Wrapper service handling the image layer on the OpenLayers map
 */
angular.module('biigle.annotations').service('mapImage', function (map, viewport) {
		"use strict";
        var extent = [0, 0, 0, 0];
        // image that is currently displayed
        var image = null;

        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');

        var webglSupported = true;
        var needsCapabilityCheck = true;

        try {
            // webgl check is done here
            var fxCanvas = fx.canvas();
            // we don't need all this if webgl is not supported
            var fxTexture = null;
            // src of the image currently loaded to the fxTexture
            var loadedImageTexture = null;
        } catch (error) {
            webglSupported = false;
            console.log(error);
        }

        window.onbeforeunload = function () {
            // Make sure the texture is destroyed when the page is left.
            // The browser may take its time to garbage collect it and it may cause
            // crashes due to lack of memory if not explicitly destroyed like this.
            if (fxTexture) {
                fxTexture.destroy();
                // tell the browser that we *really* no longer want to use the resources
                // see: http://stackoverflow.com/a/23606581/1796523
                fxCanvas.width = 1;
                fxCanvas.height = 1;
            }
        };

		var projection = new ol.proj.Projection({
			code: 'biigle-image',
			units: 'pixels',
			extent: extent
		});

		var imageLayer = new ol.layer.Image();
        map.addLayer(imageLayer);

        var DEFAULT_ADJUSTMENT = {
            brightnessContrast: [0, 0],
            brightnessRGB: [0, 0, 0],
            hueSaturation: [0, 0],
            vibrance: [0]
        };

        var colorAdjustment = {
            brightnessContrast: [0, 0],
            brightnessRGB: [0, 0, 0],
            hueSaturation: [0, 0],
            vibrance: [0]
        };

        var checkCapabilities = function (image) {
            var height = image.height;
            var width = image.width;
            // Check supported texture size.
            var size = fxCanvas._.gl.getParameter(fxCanvas._.gl.MAX_TEXTURE_SIZE);
            webglSupported = size >= height && size >= width;
            if (!webglSupported) {
                console.log('Insufficient WebGL texture size. Required: ' + width + 'x' + height + ', available: ' + size + 'x' + size + '.');
            }

            // Check supported drawing buffer size.
            // see: https://github.com/BiodataMiningGroup/biigle-annotations/issues/44
            fxCanvas.width = width;
            fxCanvas.height = height;
            if (width !== fxCanvas._.gl.drawingBufferWidth || height !== fxCanvas._.gl.drawingBufferHeight) {
                webglSupported = false;
                console.log('Your browser does not allow a WebGL drawing buffer with the size of the original image. This would result in distorted display of the image.');
            }

            // Check if the image comes from a cross origin without CORS
            if (!biigle.annotations.utils.checkCors(image)) {
                webglSupported = false;
                console.log('Color adjustment is not supported for cross origin resources.');
            }
        };

        var colorAdjustmentActive = function () {
            return !angular.equals(colorAdjustment, DEFAULT_ADJUSTMENT);
        };

        var applyColorAdjustment = function (render) {
            if (!image) {
                return;
            }

            if (loadedImageTexture !== image.src) {
                if (fxTexture) {
                    fxTexture.loadContentsOf(image);
                } else {
                    fxTexture = fxCanvas.texture(image);
                }
                loadedImageTexture = image.src;
            }

            fxCanvas.draw(fxTexture);

            for (var adjustment in colorAdjustment) {
                if (!colorAdjustment.hasOwnProperty(adjustment)) {
                    continue;
                }

                if (angular.equals(colorAdjustment[adjustment], DEFAULT_ADJUSTMENT[adjustment])) {
                    continue;
                }

                fxCanvas[adjustment].apply(fxCanvas, colorAdjustment[adjustment]);
            }

            fxCanvas.update();
            context.drawImage(fxCanvas, 0, 0);

            if (render) {
                map.render();
            }
        };

        this.renderImage = function (i) {
            image = i;
            var extentChanged = false;
            if (extent[2] && extent[3]) {
                // Only check this if the extent is actually initialized. If not, this
                // is the first image to be displayed and the extent hasn't changed
                // (and the viewport shouldn't be reset).
                extentChanged = extent[2] !== image.width || extent[3] !== image.height;
            }
            extent[2] = image.width;
            extent[3] = image.height;
            canvas.width = image.width;
            canvas.height = image.height;

            if (webglSupported && needsCapabilityCheck) {
                needsCapabilityCheck = false;
                checkCapabilities(image);
            }

            if (webglSupported && colorAdjustmentActive()) {
                // only use the WebGL color adjustment stuff if any adjustment is
                // activated since drawing directly is much quicker
                applyColorAdjustment();
            } else {
                context.drawImage(image, 0, 0);
            }

            imageLayer.setSource(new ol.source.Canvas({
                canvas: canvas,
                projection: projection,
                canvasExtent: extent,
                canvasSize: [canvas.width, canvas.height]
            }));

            var center = viewport.getCenter();
            // Set viewport to center of the extent if the image dimensions changed or
            // the center is still uninitialized.
            if (extentChanged || (center[0] === undefined || center[1] === undefined)) {
                center = ol.extent.getCenter(extent);
            }

            var zoom = viewport.getZoom();

            // create a new view because the extend may change
            map.setView(new ol.View({
                projection: projection,
                center: center,
                zoom: zoom,
                zoomFactor: 1.5,
                // allow a maximum of 4x magnification
                minResolution: 0.25,
                // restrict movement
                extent: extent
            }));

            // if zoom is not initialized, fit the view to the image extent
            if (zoom === undefined) {
                map.getView().fit(extent, map.getSize());
            }

            // apply all changes immediately
            map.renderSync();
        };

		this.getExtent = function () {
			return extent;
		};

		this.getProjection = function () {
			return projection;
		};

        this.getLayer = function () {
            return imageLayer;
        };

        this.colorAdjustment = function (params) {
            if (!webglSupported) {
                return;
            }

            var wasActive = colorAdjustmentActive();

            for (var adjustment in colorAdjustment) {
                if (!params.hasOwnProperty(adjustment) || !colorAdjustment.hasOwnProperty(adjustment)) {
                    continue;
                }

                colorAdjustment[adjustment] = params[adjustment].map(parseFloat);
            }

            // Don't render if no color adjustment is active. Check `wasActive` in case
            // the adjustment was reset and the original image should be rendered here.
            if (!wasActive && !colorAdjustmentActive()) {
                return;
            }

            applyColorAdjustment(true);
        };

        this.supportsColorAdjustment = function () {
            return webglSupported;
        };
	}
);
