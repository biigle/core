<script>
import AnnotationFilter from '../mixins/annotationFilter.vue';

export default Vue.extend({
    mixins: [AnnotationFilter],
    data() {
        return {
            name: 'shape',
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
});
</script>
