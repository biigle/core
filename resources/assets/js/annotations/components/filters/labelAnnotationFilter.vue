<script>
import AnnotationFilter from '@/annotations/mixins/annotationFilter.vue';
import LabelTypeahead from '@/label-trees/components/labelTypeahead.vue';

export default {
    extends: AnnotationFilter,
    components: {
        typeahead: LabelTypeahead,
    },
    data() {
        return {
            placeholder: 'label name',
        };
    },
    computed: {
        items() {
            let map = {};
            this.annotations.forEach(function (annotation) {
                annotation.labels.forEach(function (annotationLabel) {
                    map[annotationLabel.label.id] = annotationLabel.label;
                });
            });

            return Object.values(map);
        },
    },
    methods: {
        filter(annotations) {
            if (!this.selectedItem) {
                return annotations;
            }

            let id = this.selectedItem.id;

            return annotations.filter(function (annotation) {
                return annotation.labels.reduce(function (carry, annotationLabel) {
                    return carry || annotationLabel.label.id === id;
                }, false);
            });
        },
    },
};
</script>
