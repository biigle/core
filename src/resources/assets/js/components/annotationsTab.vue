<script>
import { AnnotationsTab } from '../import';
import LabelItem from './annotationTabLabelItem';


export default {
    mixins: [AnnotationsTab],
    components: {
        labelItem: LabelItem,
    },
    props: {
        annotationLabels: {
            type: Array,
            default: []
        },
    },
    data() {
        return {
            selectedLabel: null,
        };
    },
    computed: {
        labelItems() {
            let labels = {};
            let annotations = {};
            let uniqueMap = {};
            this.annotationLabels.forEach(function (annotation) {
                let annotationLabel = annotation.labels[0];
                if (!labels.hasOwnProperty(annotationLabel.label.id)) {
                    labels[annotationLabel.label_id] = annotationLabel.label;
                    annotations[annotationLabel.label_id] = [];
                }

                // Make sure each annotation is added only once for each label item.
                // This is important if the annotation has the same label attached by
                // multiple users.
                let uniqueKey = annotationLabel.annotation_id + '-' + annotationLabel.label_id;
                if (!uniqueMap.hasOwnProperty(uniqueKey)) {
                    uniqueMap[uniqueKey] = null;
                    annotations[annotationLabel.label_id].push(annotationLabel.annotation_id);
                }
            })

            return Object.values(labels)
                .sort(function (a, b) {
                    return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
                })
                .map(function (label) {
                    return {
                        id: label.id,
                        label: label,
                        annotations: annotations[label.id],
                    };
                });
        },
        annotationBadgeCount() {
            return this.annotationLabels.length;
        },
    },
    methods: {
        handleSelectedLabel(label) {
            this.selectedLabel = label;
            this.$emit('select', label);
        },
        handleDeselectedLabel() {
            this.selectedLabel = null;
            this.$emit('deselect');
        }
    }
};
</script>
