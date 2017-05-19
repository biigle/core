/**
 * Control for attaching labels to existing annotations
 */
biigle.$declare('annotations.ol.AttachLabelInteraction', function () {
    function AttachLabelInteraction(options) {
        ol.interaction.Pointer.call(this, {
            handleUpEvent: this.handleUpEvent,
            handleDownEvent: this.handleDownEvent,
            handleMoveEvent: this.handleMoveEvent
        });

        this.on('change:active', this.toggleActive);

        this.features = options.features !== undefined ? options.features : null;

        this.currentFeature = undefined;
        this.map = options.map;
    }

    ol.inherits(AttachLabelInteraction, ol.interaction.Pointer);

    AttachLabelInteraction.prototype.toggleActive = function (e) {
        if (e.oldValue) {
            var element = this.map.getTargetElement();
            if (element) {
                element.style.cursor = '';
            }
        }
    };

    // the label should be attached on mouseup but the event works only with the
    // pointer interaction if mousedown returned true before
    AttachLabelInteraction.prototype.handleDownEvent = function (event) {
        this.currentFeature = this.featuresAtPixel(event.pixel, event.map);
        return !!this.currentFeature;
    };

    AttachLabelInteraction.prototype.handleUpEvent = function (event) {
        if (this.currentFeature && this.currentFeature.get('annotation')) {
            this.dispatchEvent({type: 'attach', feature: this.currentFeature});
        }

        this.currentFeature = undefined;
    };

    AttachLabelInteraction.prototype.handleMoveEvent = function (event) {
        var elem = event.map.getTargetElement();
        var feature = this.featuresAtPixel(event.pixel, event.map);

        if (feature) {
            elem.style.cursor = 'pointer';
        } else {
            elem.style.cursor = '';
        }
    };

    AttachLabelInteraction.prototype.featuresAtPixel = function (pixel, map) {
        var found = null;

        var intersectingFeature = map.forEachFeatureAtPixel(pixel, function(feature) {
            return feature;
        }, this);

        if (this.handlesFeature(intersectingFeature)) {
            found = intersectingFeature;
        }

        return found;
    };

    AttachLabelInteraction.prototype.handlesFeature = function (feature) {
        if (this.features) {
            return this.features.getArray().indexOf(feature) !== -1;
        }

        return false;
    };

    return AttachLabelInteraction;
});
