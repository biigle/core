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

		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
        var fxCanvas = fx.canvas();
        var fxTexture = null;

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

        var applyFilters = function (revert) {
            if (!fxTexture) {
                return;
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
            canvas.width = fxCanvas.width;
            canvas.height = fxCanvas.height;
            context.drawImage(fxCanvas, 0, 0);
            map.render();
        };

        var renderImage = function (e, image) {
            extent[2] = image.width;
            extent[3] = image.height;

            if (fxTexture) {
                fxTexture.loadContentsOf(image);
            } else {
                fxTexture = fxCanvas.texture(image);
            }

            applyFilters();

            var center = viewport.getCenter();
            if (center[0] === undefined || center[1] === undefined) {
                // viewport center is still uninitialized
                center = ol.extent.getCenter(extent);
            }

            var zoom = viewport.getZoom();

            imageLayer.setSource(new ol.source.Canvas({
                canvas: canvas,
                projection: projection,
                canvasExtent: extent,
                canvasSize: [canvas.width, canvas.height]
            }));

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

		this.init = function (scope) {
			map.addLayer(imageLayer);
			scope.$on('image.shown', renderImage);
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
            for (var filter in filters) {
                if (!params.hasOwnProperty(filter) || !filters.hasOwnProperty(filter)) {
                    continue;
                }

                filters[filter] = params[filter].map(parseFloat);
            }

            applyFilters();
        };
	}
);
