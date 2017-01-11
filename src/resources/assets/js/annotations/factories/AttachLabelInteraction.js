/**
 * @namespace biigle.annotations
 * @ngdoc factory
 * @name AttachLabelInteraction
 * @memberOf biigle.annotations
 * @description Interaction for attaching labels to existing annotations
 */
angular.module('biigle.annotations').factory('AttachLabelInteraction', function (annotations, labels, msg) {
        "use strict";

        function AttachLabelInteraction(options) {
            ol.interaction.Pointer.call(this, {
                handleUpEvent: AttachLabelInteraction.handleUpEvent,
                handleDownEvent: AttachLabelInteraction.handleDownEvent,
                handleMoveEvent: AttachLabelInteraction.handleMoveEvent
            });

            this.features = options.features !== undefined ? options.features : null;

            this.currentFeature = undefined;
        }

        ol.inherits(AttachLabelInteraction, ol.interaction.Pointer);

        // the label should be attached on mouseup but the event works only with the
        // pointer interaction if mousedown returned true before
        AttachLabelInteraction.handleDownEvent = function (event) {
            this.currentFeature = this.featuresAtPixel(event.pixel, event.map);
            return !!this.currentFeature;
        };

        AttachLabelInteraction.handleUpEvent = function (event) {
            if (this.currentFeature && this.currentFeature.annotation && labels.hasSelected()) {
                annotations.attachAnnotationLabel(this.currentFeature.annotation);
            }

            this.currentFeature = undefined;
        };

        AttachLabelInteraction.handleMoveEvent = function (event) {
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

            var intersectingFeature = map.forEachFeatureAtPixel(pixel,
                function(feature) {
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
    }
);
