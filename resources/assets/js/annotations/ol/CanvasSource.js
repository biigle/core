import Image from 'ol/source/Image';
import ImageCanvas from 'ol/ImageCanvas';
import {listen} from 'ol/events';
import EventType from 'ol/events/EventType';
import {intersects, getHeight} from 'ol/extent';

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

    /**
     * @private
     * @type {import("../size.js").Size}
     */
    this.canvasSize_ = options.canvasSize ? options.canvasSize : null;

    listen(this.canvas_, EventType.CHANGE, this.handleImageChange, this);
  }

  /**
   * @inheritDoc
   */
  getImageInternal(extent, resolution, pixelRatio, projection) {
    if (intersects(extent, this.canvas_.getExtent())) {
      return this.canvas_;
    }
    return null;
  };
}

export default Canvas;
