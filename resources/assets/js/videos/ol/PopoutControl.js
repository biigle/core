import Control from '@biigle/ol/control/Control';

class PopoutControl extends Control {
    constructor(options) {
        let button = document.createElement('button');
        button.innerHTML = options.icon || '';
        button.title = options?.title || '';

        button.addEventListener('click', () => {
            this.dispatchEvent({type: 'click'});
        });

        let element = document.createElement('div');
        element.className = 'video-popout ol-unselectable ol-control';
        element.appendChild(button);

        super({
            element: element,
        });
    }
}

export default PopoutControl;
