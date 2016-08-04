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
        var needsTextureSizeCheck = true;

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

        var checkTextureSize = function (width, height) {
            var size = fxCanvas._.gl.getParameter(fxCanvas._.gl.MAX_TEXTURE_SIZE);
            webglSupported = size >= height && size >= width;
            if (!webglSupported) {
                console.log('Insufficient WebGL texture size. Required: ' + width + 'x' + height + ', available: ' + size + 'x' + size + '.');
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

        this.renderImage = function (e, i) {
            image = i;
            extent[2] = image.width;
            extent[3] = image.height;
            canvas.width = image.width;
            canvas.height = image.height;

            if (webglSupported && needsTextureSizeCheck) {
                needsTextureSizeCheck = false;
                checkTextureSize(image.width, image.height);
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
            if (center[0] === undefined || center[1] === undefined) {
                // viewport center is still uninitialized
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

            for (var filter in filters) {
                if (!params.hasOwnProperty(filter) || !filters.hasOwnProperty(filter)) {
                    continue;
                }

                filters[filter] = params[filter].map(parseFloat);
            }

            applyFilters(true);
        };

        this.supportsFilters = function () {
            return webglSupported;
        };
	}
);
