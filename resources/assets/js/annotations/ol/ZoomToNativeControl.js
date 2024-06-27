import Control from 'ol/control/Control';

/**
 * Control for zooming the map image to the original resolution
 */
class ZoomToNative extends Control {
    constructor(opt_options) {
        let options = opt_options || {};
        let label = options.label ? options.label : '1';
        let button = document.createElement('button');
        button.innerHTML = label;
        button.title = 'Zoom to original resolution';

        button.addEventListener('click', () => {
            this.zoomToNative.call(this);
        });

        let element = document.createElement('div');
        element.className = 'zoom-to-native ol-unselectable ol-control';
        element.appendChild(button);

        super({
            element: element,
            target: options.target
        });

        this.duration_ = options.duration !== undefined ? options.duration : 250;
    }

    zoomToNative() {
        let map = this.getMap();
        let view = map.getView();
        if (!view) {
            // the map does not have a view, so we can't act
            // upon it
            return;
        }

        let currentResolution = view.getResolution();
        if (currentResolution) {
            if (this.duration_ > 0) {
                view.animate({
                    resolution: 1,
                    duration: this.duration_,
                });
            } else {
                view.setResolution(1);
            }

        }
    }

}

export default ZoomToNative;
