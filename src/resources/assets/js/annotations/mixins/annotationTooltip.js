/**
 * Tooltip showing information on the hovered annotations.
 *
 * @type {Object}
 */
biigle.$component('annotations.mixins.annotationTooltip', {
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
    computed: {
        hasAnnotations: function () {
            return this.annotations.length > 0;
        },
        styleObject: function () {
            return 'transform: translate(' + this.position[0] + 'px,' + this.position[1] + 'px);';
        },
    },
});
