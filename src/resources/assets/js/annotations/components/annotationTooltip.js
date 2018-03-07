/**
 * Tooltip showing information on the hovered annotations.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationTooltip', {
    props: {
        annotations: {
            required: true,
            type: Array,
        },
        position: {
            required: true,
            type: Array,
        },
    },
    data: function () {
        return {
            delayPast: false,
        };
    },
    computed: {
        shown: function () {
            return this.annotations.length > 0;
        },
        styleObject: function () {
            return 'transform: translate(' + this.position[0] + 'px,' + this.position[1] + 'px);';
        },
    },
});
