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
            default() {
                return [];
            },
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
            this.annotationLabels.forEach(function (annotationLabel) {
                if (!labels.hasOwnProperty(annotationLabel.label.id)) {
                    labels[annotationLabel.label_id] = annotationLabel.label;
                    annotations[annotationLabel.label_id] = 0;
                }

                // Make sure each annotation is added only once for each label item.
                // This is important if the annotation has the same label attached by
                // multiple users.
                let uniqueKey = annotationLabel.annotation_id + '-' + annotationLabel.label_id;
                if (!uniqueMap.hasOwnProperty(uniqueKey)) {
                    uniqueMap[uniqueKey] = null;
                    annotations[annotationLabel.label_id] += 1;
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
                        count: annotations[label.id],
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
        },
        isSelected(label){
            return this.selectedLabel && label.id == this.selectedLabel.id;
        }
    }
};
</script>
