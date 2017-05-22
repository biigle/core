/**
 * An extension of the sidebar component that listens on key events.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.sidebar', {
    mixins: [biigle.$require('core.components.sidebar')],
    created: function () {
        var self = this;
        biigle.$require('events').$on('sidebar.open', function (tab) {
            self.$emit('open', tab);
        });
    },
});
