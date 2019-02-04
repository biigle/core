/**
 * Tooltip showing labels of the hovered annotations.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.labelTooltip', {
    mixins: [biigle.$require('annotations.mixins.annotationTooltip')],
    template:
    '<div class="annotation-tooltip">' +
        '<ul class="annotation-tooltip__annotations">' +
            '<li v-for="names in annotationLabels">' +
                '<ul class="annotation-tooltip__labels">' +
                    '<li v-for="name in names" v-text="name"></li>' +
                '</ul>' +
            '</li>' +
        '</ul>' +
    '</div>',
    computed: {
        annotationLabels: function () {
            return this.annotations.map(function (annotation) {
                return annotation.labels.map(function (annotationLabel) {
                    return annotationLabel.label.name;
                });
            });
        },
    },
});
