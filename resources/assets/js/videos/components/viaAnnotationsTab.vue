<script>
import AnnotationsTab from '@/annotations/components/annotationsTab.vue';

/**
 * The specific implementation of the annotations tab for the video annotation tool.
 */
export default {
    mixins: [AnnotationsTab],
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
