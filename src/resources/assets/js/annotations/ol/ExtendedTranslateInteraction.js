/**
 * Control for translating OpenLayers features with extra functions
 */
biigle.$declare('annotations.ol.ExtendedTranslateInteraction', function () {
    function ExtendedTranslateInteraction(options) {
        ol.interaction.Translate.call(this, options);

        this.features = options.features !== undefined ? options.features : null;
        this.on('change:active', this.toggleListeners);

        var self = this;

        this.translateUp = function () {
            return self.translate(0, 1);
        };

        this.translateDown = function () {
            return self.translate(0, -1);
        };

        this.translateLeft = function () {
            return self.translate(-1, 0);
        };

        this.translateRight = function () {
            return self.translate(1, 0);
        };

        this.keyboard = biigle.$require('keyboard');
        this.utils = biigle.$require('annotations.stores.utils');
        this.setMap(options.map);
        this.translating = false;
    }
    ol.inherits(ExtendedTranslateInteraction, ol.interaction.Translate);

    ExtendedTranslateInteraction.prototype.toggleListeners = function (e) {
        if (e.oldValue) {
            this.keyboard.off('ArrowLeft', this.translateLeft);
            this.keyboard.off('ArrowUp', this.translateUp);
            this.keyboard.off('ArrowRight', this.translateRight);
            this.keyboard.off('ArrowDown', this.translateDown);
            // The default translate interaction does not reset the cursor when
            // deactivated.
            var element = this.getMap().getTargetElement();
            if (element) {
                element.style.cursor = '';
            }
        } else {
            this.keyboard.on('ArrowLeft', this.translateLeft, 10);
            this.keyboard.on('ArrowUp', this.translateUp, 10);
            this.keyboard.on('ArrowRight', this.translateRight, 10);
            this.keyboard.on('ArrowDown', this.translateDown, 10);
        }
    };

    ExtendedTranslateInteraction.prototype.translate = function (deltaX, deltaY) {
        if (this.features && this.features.getLength() > 0) {
            if (!this.translating) {
                this.dispatchEvent({type: 'translatestart', features: this.features});
                this.translating = true;
            }
            this.features.forEach(function(feature) {
                var geom = feature.getGeometry();
                geom.translate(deltaX, deltaY);
                feature.setGeometry(geom);
            });
            var self = this;
            var emit = function () {
                self.translating = false;
                self.dispatchEvent({type: 'translateend', features: self.features});
            };
            this.utils.debounce(emit, 500, 'ol.interactions.Translate.translateend');
            // Cancel keyboard event handlers with lower priority if features were
            // moved.
            return false;
        }
        // if there are no features, pass on the event
        return true;
    };

    return ExtendedTranslateInteraction;
});
