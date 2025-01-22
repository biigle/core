<script>
import AnnotationsTab from '@/annotations/components/annotationsTab.vue';

/**
 * The specific implementation of the annotations tab for the video annotation tool.
 */
export default {
    extends: AnnotationsTab,
    emits: [
        'deselect',
        'select',
    ],
    methods: {
        handleSelect(annotation, shift) {
            if (annotation.isSelected && shift) {
                this.$emit('deselect', annotation);
            } else {
                this.$emit('select', annotation, annotation.startFrame, shift);
            }
        },
    },
};
</script>
