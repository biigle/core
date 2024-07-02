import PointerInteraction from 'ol/interaction/Pointer';

/**
 * Control for attaching labels to existing annotations
 */
class AttachLabelInteraction extends PointerInteraction {
    constructor(options) {
        super(options);

        this.on('change:active', this.toggleActive);

        this.features = options.features !== undefined ? options.features : null;

        this.currentFeature = undefined;
        this.map = options.map;
    }

    toggleActive(e) {
        if (e.oldValue) {
            let element = this.map.getTargetElement();
            if (element) {
                element.style.cursor = '';
            }
        }
    }

    // the label should be attached on mouseup but the event works only with the
    // pointer interaction if mousedown returned true before
    handleDownEvent(event) {
        this.currentFeature = this.featuresAtPixel(event.pixel, event.map);
        return !!this.currentFeature;
    }

    handleUpEvent() {
        if (this.currentFeature && this.currentFeature.get('annotation')) {
            this.dispatchEvent({type: 'attach', feature: this.currentFeature});
        }

        this.currentFeature = undefined;
    }

    handleMoveEvent(event) {
        let elem = event.map.getTargetElement();
        let feature = this.featuresAtPixel(event.pixel, event.map);

        if (feature) {
            elem.style.cursor = 'pointer';
        } else {
            elem.style.cursor = '';
        }
    }

    featuresAtPixel(pixel, map) {
        let found = null;

        let intersectingFeature = map.forEachFeatureAtPixel(pixel, function (feature) {
            return feature;
        }, this);

        if (this.handlesFeature(intersectingFeature)) {
            found = intersectingFeature;
        }

        return found;
    }

    handlesFeature(feature) {
        if (this.features) {
            return this.features.getArray().indexOf(feature) !== -1;
        }

        return false;
    }
}

export default AttachLabelInteraction;
