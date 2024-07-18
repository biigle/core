import Circle from '@biigle/ol/geom/Circle';
import Draw from '@biigle/ol/interaction/Draw';
import Event from '@biigle/ol/events/Event.js';
import EventType from '@biigle/ol/events/EventType';
import Feature from '@biigle/ol/Feature';
import MapBrowserEventType from '@biigle/ol/MapBrowserEventType';
import VectorLayer from '@biigle/ol/layer/Vector';
import {always} from '@biigle/ol/events/condition';
import {createEditingStyle} from '@biigle/ol/style/Style';
import {fromCircle} from '@biigle/ol/geom/Polygon';
import {polygon as turfPolygon} from '@turf/helpers';
import {shiftKeyOnly, penOnly} from '@biigle/ol/events/condition';
import {union} from '../geom/flat/union';

const MIN_BRUSH_SIZE = 5;
const BRUSH_RESIZE_STEP = 5;

const DrawEventType = {
  DRAWSTART: 'drawstart',
  DRAWEND: 'drawend',
  DRAWABORT: 'drawabort'
};

class DrawEvent extends Event {
  constructor(type, feature) {
    super(type);
    this.feature = feature;
  }
}

export function getNewSketchPointRadius(event, radius) {
  let delta = event.originalEvent.deltaY;
  // Take the delta from deltaX if deltyY is 0 because some systems toggle the scroll
  // direction with certain keys pressed (e.g. Mac with Shift+Scroll).
  if (event.type == EventType.MOUSEWHEEL) {
    delta = -event.originalEvent.wheelDeltaY;
    if (delta === 0) {
      delta = -event.originalEvent.wheelDeltaX;
    }
  } else if (delta === 0) {
    delta = event.originalEvent.deltaX;
  }

  let step = BRUSH_RESIZE_STEP;
  if (radius <= (BRUSH_RESIZE_STEP * 5)) {
    step = 1;
  }

  if (delta > 0) {
    return radius + step;
  }

  if (delta < 0) {
    return Math.max(radius - step, MIN_BRUSH_SIZE);
  }

  return radius;
}

export function getNewSketchPointRadiusByPressure(event, radius) {
  if (event.pointerEvent.pressure != 0) {
    radius = getNewSketchPointRadius(event, radius);

    return Math.max(radius * event.pointerEvent.pressure, MIN_BRUSH_SIZE) *
      event.map.getView().getResolution();
  }

  return radius;
}

/**
 * @classdesc
 * Interaction for drawing polygons with a brush.
 *
 * @fires DrawEvent
 * @api
 */
class PolygonBrush extends Draw {

  constructor(options) {

    options.freehandCondition = options.freehandCondition ?
      options.freehandCondition : penOnly;

    options.type = 'Polygon';

    super(options);

    // Override the default overlay to set updateWhileAnimating.
    this.overlay_ = new VectorLayer({
      source: this.overlay_.getSource(),
      style: options.style ? options.style : getDefaultStyleFunction(),
      updateWhileAnimating: true,
      updateWhileInteracting: true
    });

    this.sketchPointRadius_ = options.brushRadius !== undefined ?
      options.brushRadius : 100;
    this.condition_ = options.condition !== undefined ?
      options.condition : always;
    this.resizeCondition_ = options.resizeCondition !== undefined ?
      options.resizeCondition : shiftKeyOnly;

    this.isDrawing_ = false;
    this.sketchCircle_ = null;
  }

  setMap(map) {
    super.setMap(map);
    if (map) {
      let view = map.getView();
      if (view) {
        this.watchViewForChangedResolution(view);
      }

      map.on('change:view', e => this.watchViewForChangedResolution(e.target.getView()));
    }
  }

  watchViewForChangedResolution(view) {
    view.on('change:resolution', this.updateRelativeSketchPointRadius_.bind(this));
  }

  handleEvent(event) {
    const type = event.type;
    let pass = true;
    if (this.resizeCondition_(event) &&
      (type === EventType.WHEEL || EventType.MOUSEWHEEL)) {
      event.originalEvent.preventDefault();
      this.updateAbsoluteSketchPointRadius_(event);
      pass = false;
    }

    if (event.type === MapBrowserEventType.POINTERDRAG && this.handlingDownUpSequence) {
      pass = false;
    }

    return super.handleEvent(event) && pass;
  }

  handleDownEvent(event) {
    if (!this.handlingDownUpSequence) {
      if (this.condition_(event)) {
        this.startDrawing_(event);

        return true;
      }
    }

    return false;
  }

  handleUpEvent() {
    if (this.handlingDownUpSequence && this.isDrawing_) {
      this.finishDrawing();

      return true;
    }

    return false;
  }

  createOrUpdateSketchPoint_(event) {
    const coordinates = event.coordinate.slice();
    if (!this.sketchPoint_) {
      let relativeRadius = event.map.getView().getResolution() * this.sketchPointRadius_;
      this.sketchPoint_ = new Feature(new Circle(coordinates, relativeRadius));
      this.updateSketchFeatures_();
    } else {
      const sketchPointGeom = this.sketchPoint_.getGeometry();
      sketchPointGeom.setCenter(coordinates);
    }
  }

  updateRelativeSketchPointRadius_(event) {
    if (this.sketchPoint_) {
      this.sketchPoint_.getGeometry().setRadius(
        this.sketchPointRadius_ * event.target.getResolution()
      );
    }
  }

  updateAbsoluteSketchPointRadius_(event) {
    if (this.sketchPoint_) {
      this.sketchPointRadius_ = getNewSketchPointRadius(event, this.sketchPointRadius_);
      this.sketchPoint_.getGeometry().setRadius(
        this.sketchPointRadius_ * event.map.getView().getResolution()
      );
    }
  }

  createOrUpdateSketchCircle_(event) {
    const coordinates = event.coordinate.slice();
    if (!this.sketchCircle_) {
      this.sketchCircle_ = new Circle(coordinates, this.sketchPoint_.getGeometry().getRadius());
    } else {
      this.sketchCircle_.setCenter(coordinates);
      this.sketchCircle_.setRadius(this.sketchPoint_.getGeometry().getRadius())
    }

    if (event.originalEvent.pointerType === 'pen') {
      this.sketchCircle_.setRadius(
        getNewSketchPointRadiusByPressure(event, this.sketchPointRadius_)
      );
    }
  }

  startDrawing_(event) {
    this.isDrawing_ = true;
    this.createOrUpdateSketchPoint_(event);
    this.createOrUpdateSketchCircle_(event);
    const start = event.coordinate;
    this.finishCoordinate_ = start;
    this.sketchFeature_ = new Feature(fromCircle(this.sketchCircle_));
    this.updateSketchFeatures_();
    this.dispatchEvent(new DrawEvent(DrawEventType.DRAWSTART, this.sketchFeature_));
  }

  handlePointerMove_(event) {
    this.createOrUpdateSketchPoint_(event);
    this.createOrUpdateSketchCircle_(event);

    if (this.isDrawing_ && this.sketchFeature_) {
      const sketchCircleGeometry = fromCircle(this.sketchCircle_);
      const sketchCirclePolygon = turfPolygon(sketchCircleGeometry.getCoordinates());
      const sketchFeatureGeometry = this.sketchFeature_.getGeometry();
      const sketchFeaturePolygon = turfPolygon(sketchFeatureGeometry.getCoordinates());

      // The order of the union() arguments matters! The feature polygon will be kept if
      // there is no intersection with the circle.
      sketchFeatureGeometry.setCoordinates(union(sketchFeaturePolygon, sketchCirclePolygon));
    }
  }

  finishDrawing() {
    this.isDrawing_ = false;
    const sketchFeature = this.abortDrawing_();
    if (!sketchFeature) {
      return;
    }

    this.dispatchEvent(new DrawEvent(DrawEventType.DRAWEND, sketchFeature));
    if (this.features_) {
      this.features_.push(sketchFeature);
    }
    if (this.source_) {
      this.source_.addFeature(sketchFeature);
    }
  }

  getBrushRadius() {
    return this.sketchPointRadius_;
  }

  abortDrawing_() {
    this.sketchCircle_ = null;

    return super.abortDrawing_();
  }
}

function getDefaultStyleFunction() {
  let styles = createEditingStyle();
  styles['Polygon'] =
      styles['Polygon'].concat(
        styles['LineString']
      );

  return function(feature) {
    return styles[feature.getGeometry().getType()];
  };
}

export default PolygonBrush;
