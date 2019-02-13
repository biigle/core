/**
 * The specific implementation of the annotations tab for the still image annotation
 * tool.
 */
biigle.$component('annotations.components.siaAnnotationsTab', {
    mixins: [biigle.$require('annotations.components.annotationsTab')],
    computed: {
        plugins: function () {
            return biigle.$require('annotations.components.annotationsTabPlugins');
        },
    },
});

/**
 * Additional components that can be dynamically added by other Biigle modules via
 * view mixins. These components are meant for the "annotationsAnnotationsTab" view mixin
 * mount point.
 *
 * @type {Object}
 */
biigle.$declare('annotations.components.annotationsTabPlugins', {});
