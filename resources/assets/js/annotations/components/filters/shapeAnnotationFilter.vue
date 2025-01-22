<script>
import AnnotationFilter from '@/annotations/mixins/annotationFilter.vue';

export default {
    extends: AnnotationFilter,
    data() {
        return {
            shapes: [],
            placeholder: 'shape name',
        };
    },
    computed: {
        items() {
            return Object.keys(this.shapes).map((id) => {
                return {
                    id: parseInt(id),
                    name: this.shapes[id],
                };
            });
        },
    },
    methods: {
        filter(annotations) {
            if (!this.selectedItem) {
                return annotations;
            }

            return annotations.filter((annotation) => {
                return annotation.shape_id === this.selectedItem.id;
            });
        },
    },
    created() {
        this.shapes = biigle.$require('annotations.shapes');
    },
};
</script>
