import AnnotationFilter from '../mixins/annotationFilter';
import {LabelTypeahead} from '../import';

export default Vue.extend({
    mixins: [AnnotationFilter],
    components: {
        typeahead: LabelTypeahead,
    },
    data() {
        return {
            name: 'label',
            annotations: [],
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
});
