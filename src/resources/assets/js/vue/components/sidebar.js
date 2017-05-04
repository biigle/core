/**
 * An extension of the sidebar component that listens on key events.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.sidebar', {
    mixins: [biigle.$require('core.components.sidebar')],
    created: function () {
        // keyboard events to open and close individual tabs
    },
});
