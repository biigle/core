/**
 * @namespace dias.annotations
 * @ngdoc factory
 * @name map
 * @memberOf dias.annotations
 * @description Wrapper factory handling OpenLayers map
 */
angular.module('dias.annotations').factory('map', function (ZoomToNativeControl) {
        "use strict";

        var map = new ol.Map({
            target: 'canvas',
            renderer: 'canvas',
            controls: [
                new ol.control.Zoom(),
                new ol.control.ZoomToExtent({
                    tipLabel: 'Zoom to show whole image',
                    // bootstrap glyphicons resize-small icon
                    label: '\ue097'
                }),
                new ol.control.FullScreen({
                    // bootstrap glyphicons fullscreen icon
                    label: '\ue140'
                }),
                new ZoomToNativeControl({
                    // bootstrap glyphicons resize-full icon
                    label: '\ue096'
                })
            ],
            interactions: ol.interaction.defaults({
                altShiftDragRotate: false,
                doubleClickZoom: false,
                keyboard: false,
                shiftDragZoom: false,
                pinchRotate: false,
                pinchZoom: false
            })
        });

        return map;
    }
);
