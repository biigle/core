import { shiftKeyOnly, penOnly, touchOnly } from '@biigle/ol/events/condition';

// Custom OpenLayers freehandCondition that is true if either the input is pen/touch or the
// shift key is pressed (but not both).
export let penTouchXorShift = function (mapBrowserEvent) {
    let penOrTouch = penOnly(mapBrowserEvent) || touchOnly(mapBrowserEvent);
    let isShift = shiftKeyOnly(mapBrowserEvent);

    return penOrTouch && !isShift || !penOrTouch && isShift;
};

// Custom OpenLayers freehandCondition that is true if either the input is a pen or touch or the shift key is pressed or all.
export let penTouchOrShift = function (mapBrowserEvent) {
    return penOnly(mapBrowserEvent) || shiftKeyOnly(mapBrowserEvent) || touchOnly(mapBrowserEvent);
};
