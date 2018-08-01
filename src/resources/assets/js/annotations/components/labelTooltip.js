/**
 * Tooltip showing labels of the hovered annotations.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.labelTooltip', {
    mixins: [biigle.$require('annotations.mixins.annotationTooltip')],
    computed: {
        annotationLabels: function () {
            return this.annotations.map(function (annotation) {
                return annotation.labels;
            });
        },
    },
});
