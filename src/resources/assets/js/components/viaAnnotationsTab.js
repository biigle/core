/**
 * The specific implementation of the annotations tab for the video annotation tool.
 */
biigle.$component('videos.components.viaAnnotationsTab', {
    mixins: [biigle.$require('annotations.components.annotationsTab')],
    methods: {
        handleSelect: function (annotation, shift) {
            if (annotation.isSelected && shift) {
                this.$emit('deselect', annotation);
            } else {
                this.$emit('select', annotation, annotation.startFrame, shift);
            }
        },
    },
});
