import Map from '@biigle/ol/Map';

// OL Map that allows explicit canceling of the next animation frame for rendering.
export class CancelableMap extends Map {
    cancelRender() {
        if (this.animationDelayKey_) {
          cancelAnimationFrame(this.animationDelayKey_);
          this.animationDelayKey_ = undefined;
        }
    }
}

export default CancelableMap;
