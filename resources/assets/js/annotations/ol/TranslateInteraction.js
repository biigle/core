import BaseTranslate from '@biigle/ol/interaction/Translate';
import Keyboard from '../../core/keyboard';
import {debounce} from '../../core/utils';

/**
 * Control for translating OpenLayers features with extra functions
 */
class Translate extends BaseTranslate {
    constructor(options) {
        super(options);

        this.features = options.features !== undefined ? options.features : null;
        this.on('change:active', this.toggleListeners);

        this.translateUp = () => {
            return this.translate(0, 1);
        };

        this.translateDown = () => {
            return this.translate(0, -1);
        };

        this.translateLeft = () => {
            return this.translate(-1, 0);
        };

        this.translateRight = () => {
            return this.translate(1, 0);
        };

        this.setMap(options.map);
        this.translating = false;
    }

    toggleListeners(e) {
        if (e.oldValue) {
            Keyboard.off('ArrowLeft', this.translateLeft);
            Keyboard.off('ArrowUp', this.translateUp);
            Keyboard.off('ArrowRight', this.translateRight);
            Keyboard.off('ArrowDown', this.translateDown);
            // The default translate interaction does not reset the cursor when
            // deactivated.
            let element = this.getMap().getTargetElement();
            if (element) {
                element.style.cursor = '';
            }
        } else {
            Keyboard.on('ArrowLeft', this.translateLeft, 10);
            Keyboard.on('ArrowUp', this.translateUp, 10);
            Keyboard.on('ArrowRight', this.translateRight, 10);
            Keyboard.on('ArrowDown', this.translateDown, 10);
        }
    }

    translate(deltaX, deltaY) {
        if (this.lastCoordinate_ === null && this.features && this.features.getLength() > 0) {
            if (!this.translating) {
                this.dispatchEvent({type: 'translatestart', features: this.features});
                this.translating = true;
            }
            this.features.forEach(function(feature) {
                let geom = feature.getGeometry();
                geom.translate(deltaX, deltaY);
                feature.setGeometry(geom);
            });
            let emit = () => {
                this.translating = false;
                this.dispatchEvent({type: 'translateend', features: this.features});
            };
            debounce(emit, 500, 'ol.interactions.Translate.translateend');
            // Cancel keyboard event handlers with lower priority if features were
            // moved.
            return false;
        }
        // if there are no features, pass on the event
        return true;
    }
}

export default Translate;
