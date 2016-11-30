/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name mapImage
 * @memberOf dias.annotations
 * @description Wrapper service handling the image layer on the OpenLayers map
 */
angular.module('dias.annotations').service('mapImage', function (map, viewport) {
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
			code: 'dias-image',
			units: 'pixels',
			extent: extent
		});

		var imageLayer = new ol.layer.Image();
        map.addLayer(imageLayer);

        var DEFAULT_FILTERS = {
            brightnessContrast: [0, 0],
            brightnessRGB: [0, 0, 0],
            hueSaturation: [0, 0],
            vibrance: [0]
        };

        var filters = {
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
            // see: https://github.com/BiodataMiningGroup/dias-annotations/issues/44
            fxCanvas.width = width;
            fxCanvas.height = height;
            if (width !== fxCanvas._.gl.drawingBufferWidth || height !== fxCanvas._.gl.drawingBufferHeight) {
                webglSupported = false;
                console.log('Your browser does not allow a WebGL drawing buffer with the size of the original image. This would result in distorted display of the image.');
            }

            // Check if the image comes from a cross origin without CORS
            if (!biigle.annotations.utils.checkCors(image)) {
                webglSupported = false;
                console.log('Image filters are not supported for cross origin resources.');
            }
        };

        var filtersActive = function () {
            return !angular.equals(filters, DEFAULT_FILTERS);
        };

        var applyFilters = function (render) {
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

            for (var filter in filters) {
                if (!filters.hasOwnProperty(filter)) {
                    continue;
                }

                if (angular.equals(filters[filter], DEFAULT_FILTERS[filter])) {
                    continue;
                }

                fxCanvas[filter].apply(fxCanvas, filters[filter]);
            }

            fxCanvas.update();
            context.drawImage(fxCanvas, 0, 0);

            if (render) {
                map.render();
            }
        };

        this.renderImage = function (i) {
            image = i;
            var extentChanged = extent[2] !== image.width || extent[3] !== image.height;
            extent[2] = image.width;
            extent[3] = image.height;
            canvas.width = image.width;
            canvas.height = image.height;

            if (webglSupported && needsCapabilityCheck) {
                needsCapabilityCheck = false;
                checkCapabilities(image);
            }

            if (webglSupported && filtersActive()) {
                // only use the WebGL filter stuff if any of the filters are activated
                // since drawing directly is much quicker
                applyFilters();
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

        this.filter = function (params) {
            if (!webglSupported) {
                return;
            }

            var wasActive = filtersActive();

            for (var filter in filters) {
                if (!params.hasOwnProperty(filter) || !filters.hasOwnProperty(filter)) {
                    continue;
                }

                filters[filter] = params[filter].map(parseFloat);
            }

            // Don't render if no filters are active. Check `wasActive` in case the
            // filters were reset and the original image should be rendered here.
            if (!wasActive && !filtersActive()) {
                return;
            }

            applyFilters(true);
        };

        this.supportsFilters = function () {
            return webglSupported;
        };
	}
);
