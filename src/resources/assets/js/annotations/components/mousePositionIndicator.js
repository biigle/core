/**
 * The mouse position indicator of the canvas element
 *
 * @type {Object}
 */
biigle.$component('annotations.components.mousePositionIndicator', {
    props: {
        position: {
            required: true,
        },
    },
    computed: {
        positionText: function () {
            return this.position[0] + ' × ' + this.position[1];
        },
    },
});
