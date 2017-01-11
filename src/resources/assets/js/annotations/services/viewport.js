/**
 * @namespace biigle.annotations
 * @ngdoc service
 * @name viewport
 * @memberOf biigle.annotations
 * @description Manages the map viewport
 */
angular.module('biigle.annotations').service('viewport', function (urlParams) {
        "use strict";

        var viewport = {
            zoom: urlParams.get('z'),
            center: [urlParams.get('x'), urlParams.get('y')]
        };

        this.set = function (v) {
            viewport.zoom = v.zoom;
            viewport.center[0] = Math.round(v.center[0]);
            viewport.center[1] = Math.round(v.center[1]);
            urlParams.set({
                z: viewport.zoom,
                x: viewport.center[0],
                y: viewport.center[1]
            });
        };

        this.get = function () {
            return viewport;
        };

        this.getZoom = function () {
            return viewport.zoom;
        };

        this.getCenter = function () {
            return viewport.center;
        };
    }
);
