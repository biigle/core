import Control from '@biigle/ol/control/Control';

class PopoutControl extends Control {
    constructor() {
        let button = document.createElement('button');
        button.innerHTML = '\uf31e'; // FontAwesome expand-arrows-alt
        button.title = 'Move the video to a popup window';

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
