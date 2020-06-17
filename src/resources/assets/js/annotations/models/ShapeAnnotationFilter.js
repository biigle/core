import AnnotationFilter from '../mixins/annotationFilter';

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
            return annotations.filter((annotation) => {
                return annotation.shape_id === this.selectedItem.id;
            });
        },
    },
});
