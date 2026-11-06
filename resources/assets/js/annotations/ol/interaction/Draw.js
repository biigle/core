import MapBrowserEventType from '@biigle/ol/MapBrowserEventType';
import OlDraw from '@biigle/ol/interaction/Draw';

export {createBox} from '@biigle/ol/interaction/Draw';

/**
 * Draw interaction that also updates the sketch (e.g. the point that shows where the
 * next vertex is placed) if a pen hovers over the map. OpenLayers only does this for
 * a mouse but pens (e.g. of a Wacom tablet) can hover, too.
 *
 * See: https://github.com/biigle/core/issues/920
 */
class Draw extends OlDraw {
    handleEvent(event) {
        const pass = super.handleEvent(event);

        // In freehand mode, OpenLayers already handles this.
        if (event.type === MapBrowserEventType.POINTERMOVE &&
            event.originalEvent.pointerType === 'pen' &&
            !this.freehand_ &&
            this.getPointerCount() < 2) {
            this.handlePointerMove_(event);
        }

        return pass;
    }
}

export default Draw;
