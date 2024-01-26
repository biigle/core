import {Settings} from '../import';

/**
 * Store for largo settings
 */

let defaults = {
    showOutlines: true,
};

export default new Settings({
    data: {
        storageKey: 'biigle.largo.settings',
        defaults: defaults,
    },
});
