/**
 * Store for the OpenLayers map
 */
biigle.$declare('annotations.stores.map', function () {
    var map = new ol.Map({
        renderer: 'canvas',
        controls: [
            new ol.control.Zoom(),
            new ol.control.ZoomToExtent({
                tipLabel: 'Zoom to show whole image',
                // bootstrap glyphicons resize-small icon
                label: '\ue097'
            }),
        ],
        interactions: ol.interaction.defaults({
            altShiftDragRotate: false,
            doubleClickZoom: false,
            keyboard: false,
            shiftDragZoom: false,
            pinchRotate: false,
            pinchZoom: false
        }),
    });

    var ZoomToNativeControl = biigle.$require('annotations.ol.ZoomToNativeControl');
    map.addControl(new ZoomToNativeControl({
        // bootstrap glyphicons resize-full icon
        label: '\ue096'
    }));

    return map;
});
