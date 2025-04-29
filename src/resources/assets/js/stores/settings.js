import {Settings} from '../import.js';

/**
 * Store for largo settings
 */

let defaults = {
    showOutlines: true,
};

export default new Settings({
    storageKey: 'biigle.largo.settings',
    defaults: defaults,
});
