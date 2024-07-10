import {polygon as turfPolygon} from '@turf/helpers';
import booleanContains from '@turf/boolean-contains';
import Feature from '@biigle/ol/Feature';
import EventType from '@biigle/ol/events/EventType';
import Circle from '@biigle/ol/geom/Circle';
import Polygon from '@biigle/ol/geom/Polygon';
import {createEditingStyle} from '@biigle/ol/style/Style';
import Modify from '@biigle/ol/interaction/Modify';
import {ModifyEvent} from '@biigle/ol/interaction/Modify';
import {shiftKeyOnly} from '@biigle/ol/events/condition';
import {fromCircle} from '@biigle/ol/geom/Polygon';
import {union} from '../geom/flat/union';
import {difference} from '../geom/flat/difference';
import {always} from '@biigle/ol/events/condition';
import Collection from '@biigle/ol/Collection';
import {getNewSketchPointRadius, getNewSketchPointRadiusByPressure} from './PolygonBrush';

export const ModifyEventType = {
  MODIFYSTART: 'modifystart',
  MODIFYREMOVE: 'modifyremove',
  MODIFYEND: 'modifyend',
};

/**
 * @classdesc
 * Interaction for modifying polygons with a brush.
 *
 * @fires ModifyEvent
 * @api
 */
class ModifyPolygonBrush extends Modify {
  constructor(options) {

    super(options);

    this.overlay_.setStyle(options.style ? options.style : getDefaultStyleFunction());

    this.sketchPoint_ = null;
    this.sketchPointRadius_ = options.brushRadius !== undefined ?
      options.brushRadius : 100;
    this.addCondition_ = options.addCondition !== undefined ?
      options.addCondition : always;
    this.subtractCondition_ = options.subtractCondition !== undefined ?
      options.subtractCondition : always;
    this.resizeCondition_ = options.resizeCondition !== undefined ?
      options.resizeCondition : shiftKeyOnly;
    this.allowRemove_ = options.allowRemove !== undefined ?
      options.allowRemove : true;

    this.isAdding_ = false;
    this.isSubtracting_ = false;

    this.sketchCircle_ = null;

  }

  setMap(map) {
    super.setMap(map);
    if (map) {
      let view = map.getView();
      if (view) {
        this.watchViewForChangedResolution(view);
      }

      map.on('change:view', (function (e) {
        this.watchViewForChangedResolution(e.target.getView());
      }).bind(this));
    }
  }

  watchViewForChangedResolution(view) {
    view.on('change:resolution', this.updateRelativeSketchPointRadius_.bind(this));
  }

  createOrUpdateSketchPoint_(event) {
    const coordinates = event.coordinate.slice();
    if (!this.sketchPoint_) {
      let relativeRadius = event.map.getView().getResolution() * this.sketchPointRadius_;
      this.sketchPoint_ = new Feature(new Circle(coordinates, relativeRadius));
      this.overlay_.getSource().addFeature(this.sketchPoint_)
    } else {
      const sketchPointGeom = this.sketchPoint_.getGeometry();
      sketchPointGeom.setCenter(coordinates);
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

  handleEvent(event) {
    const type = event.type;
    let pass = true;
    if (this.resizeCondition_(event) &&
      (type === EventType.WHEEL || EventType.MOUSEWHEEL)) {
      event.originalEvent.preventDefault();
      this.updateAbsoluteSketchPointRadius_(event);
      pass = false;
    }

    return super.handleEvent(event) && pass;
  }

  handlePointerMove_(event) {
    this.createOrUpdateSketchPoint_(event);
    this.createOrUpdateSketchCircle_(event);
  }

  handleDownEvent(event) {
    if (!this.handlingDownUpSequence) {
      this.createOrUpdateSketchPoint_(event);
      this.createOrUpdateSketchCircle_(event);

      if (this.subtractCondition_(event)) {
        this.startSubtracting_(event);

        return true;
      } else if (this.addCondition_(event)) {
        this.startAdding_(event);

        return true;
      }
    }

    return false;
  }

  handleUpEvent(event) {
    if (this.handlingDownUpSequence && (this.isSubtracting_ || this.isAdding_)) {
      this.finishModifying_(event);

      return true;
    }

    return false;
  }

  startSubtracting_(event) {
    this.isSubtracting_ = true;
    // this.willModifyFeatures_(event, []);
    this.subtractCurrentFeatures_(event);
  }

  startAdding_(event) {
    this.isAdding_ = true;
    // this.willModifyFeatures_(event, []);
    this.addCurrentFeatures_(event);
  }

  handleDragEvent(event) {
    this.createOrUpdateSketchPoint_(event);
    this.createOrUpdateSketchCircle_(event);
    if (this.isSubtracting_) {
      this.subtractCurrentFeatures_(event);
    } else if (this.isAdding_) {
      this.addCurrentFeatures_(event);
    }
  }

  subtractCurrentFeatures_(event) {
    const sketchPointGeom = fromCircle(this.sketchCircle_);
    let sketchPointPolygon = turfPolygon(sketchPointGeom.getCoordinates());
    let sketchPointArea = sketchPointGeom.getArea();
    this.features_.getArray().forEach(function (feature) {
      let featureGeom = feature.getGeometry();
      try {
        var featurePolygon = turfPolygon(featureGeom.getCoordinates());
      } catch (e) {
        // Skip features that can't be represented as polygon.
        return;
      }
      if (this.allowRemove_ && booleanContains(sketchPointPolygon, featurePolygon)) {
          this.features_.remove(feature);
          if (this.source_) {
            this.source_.removeFeature(feature);
          }
          this.dispatchEvent(
            new ModifyEvent(ModifyEventType.MODIFYREMOVE, new Collection([feature]), event)
          );
      } else {
        var coords = difference(featurePolygon, sketchPointPolygon);
        if (!this.allowRemove_ && sketchPointArea > (new Polygon(coords)).getArea()) {
          // If allowRemove_ is false, the modified polygon may not become smaller than
          // the sketchPointPolygon.
          return;
        }
        featureGeom.setCoordinates(coords);
    }
    }, this);
  }

  addCurrentFeatures_() {
    const sketchPointGeom = fromCircle(this.sketchCircle_);
    let sketchPointPolygon = turfPolygon(sketchPointGeom.getCoordinates());
    this.features_.getArray().forEach(function (feature) {
      let featureGeom = feature.getGeometry();
      try {
        var featurePolygon = turfPolygon(featureGeom.getCoordinates());
      } catch (e) {
        // Skip features that can't be represented as polygon.
        return;
      }
      featureGeom.setCoordinates(union(sketchPointPolygon, featurePolygon));
    }, this);
  }

  finishModifying_(event) {
    this.isSubtracting_ = false;
    this.isAdding_ = false;
    this.dispatchEvent(new ModifyEvent(ModifyEventType.MODIFYEND, this.features_, event));
  }

  getBrushRadius() {
    return this.sketchPointRadius_;
  }
}

function getDefaultStyleFunction() {
  const style = createEditingStyle();

  return function() {
    return style['Circle'];
  }
}


export default ModifyPolygonBrush;
