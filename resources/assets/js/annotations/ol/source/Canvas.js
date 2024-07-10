import Image from '@biigle/ol/source/Image';
import ImageCanvas from '@biigle/ol/ImageCanvas';
import {listen} from '@biigle/ol/events';
import EventType from '@biigle/ol/events/EventType';
import {getHeight} from '@biigle/ol/extent';

/**
 * @classdesc
 * Base class for canvas sources where a canvas element is the canvas.
 * @api
 */
class Canvas extends Image {
  /**
   * @param {Options} options Single image source options.
   */
  constructor(options) {
    super({
      attributions: options.attributions,
      projection: options.projection,
      resolutions: options.resolutions,
      state: options.state
    })

    let resolution = getHeight(options.canvasExtent) / options.canvas.height;

    /**
     * @private
     * @type {import("../ImageCanvas.js").ImageCanvas}
     */
    this.canvas_ = new ImageCanvas(options.canvasExtent, resolution, 1, options.canvas);

    listen(this.canvas_, EventType.CHANGE, this.handleImageChange, this);
  }

  /**
   * @inheritDoc
   */
  getImageInternal() {
    // No need to check if extent intersects canvas. The canvas is always visible
    // in our apllication.
    return this.canvas_;
  }
}

export default Canvas;
