import { shiftKeyOnly, penOnly } from '@biigle/ol/events/condition';

// Custom OpenLayers freehandCondition that is true if either the input is a pen or the
// shift key is pressed (but not both).
export let penXorShift = function (mapBrowserEvent) {
    let isPen = penOnly(mapBrowserEvent);
    let isShift = shiftKeyOnly(mapBrowserEvent);

    return isPen && !isShift || !isPen && isShift;
};

// Custom OpenLayers freehandCondition that is true if either the input is a pen or the shift key is pressed or both.
export let penOrShift = function (mapBrowserEvent) {
    return penOnly(mapBrowserEvent) || shiftKeyOnly(mapBrowserEvent);
};
