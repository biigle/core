/**
 * @namespace dias.annotations
 * @ngdoc factory
 * @name ExtendedTranslateInteraction
 * @memberOf dias.annotations
 * @description Extends the default translate interaction by keyboard controls
 */
angular.module('dias.annotations').factory('ExtendedTranslateInteraction', function (keyboard, map) {
        "use strict";

        function ExtendedTranslateInteraction(options) {
            ol.interaction.Translate.call(this, options);

            this.features = options.features !== undefined ? options.features : null;
            this.on('change:active', this.toggleListeners);

            var _this = this;

            this.translateUp = function () {
                return _this.translate(0, 1);
            };

            this.translateDown = function () {
                return _this.translate(0, -1);
            };

            this.translateLeft = function () {
                return _this.translate(-1, 0);
            };

            this.translateRight = function () {
                return _this.translate(1, 0);
            };
        }
        ol.inherits(ExtendedTranslateInteraction, ol.interaction.Translate);

        ExtendedTranslateInteraction.prototype.toggleListeners = function (e) {
            if (e.oldValue) {
                keyboard.off(37, this.translateLeft);
                keyboard.off(38, this.translateUp);
                keyboard.off(39, this.translateRight);
                keyboard.off(40, this.translateDown);
                // The default translate interaction does not reset the cursor when
                // deactivated.
                map.getTargetElement().style.cursor = '';
            } else {
                keyboard.on(37, this.translateLeft, 10);
                keyboard.on(38, this.translateUp, 10);
                keyboard.on(39, this.translateRight, 10);
                keyboard.on(40, this.translateDown, 10);
            }
        };

        ExtendedTranslateInteraction.prototype.translate = function (deltaX, deltaY) {
            if (this.features && this.features.getLength() > 0) {
                this.features.forEach(function(feature) {
                    var geom = feature.getGeometry();
                    geom.translate(deltaX, deltaY);
                    feature.setGeometry(geom);
                });
            } else {
                // if there are no features, pass on the event
                return true;
            }

            // cancel keyboard event handlers with lower priority if features were moved
            return false;
        };

        return ExtendedTranslateInteraction;
    }
);
