<script>
import { AnnotationsTab } from '../import';
import LabelItem from './annotationTabLabelItem';

/**
 * An example annotation patch image.
 *
 * @type {Object}
 */
export default {
    mixins: [AnnotationsTab],
    components:{
        labelItem: LabelItem,
    },
    props:{
        filesData: {
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
            this.filesData.forEach(function(image) {
                image.annotations.forEach(function (annotation) {
                    annotation.labels.forEach(function (annotationLabel) {
                    if (!labels.hasOwnProperty(annotationLabel.label.id)) {
                        labels[annotationLabel.label_id] = annotationLabel.label;
                        annotations[annotationLabel.label_id] = [];
                    }

                    // Make sure each annotation is added only once for each label item.
                    // This is important if the annotation has the same label attached by
                    // multiple users.
                    let uniqueKey = annotation.id + '-' + annotationLabel.label_id;
                    if (!uniqueMap.hasOwnProperty(uniqueKey)) {
                        uniqueMap[uniqueKey] = null;
                        annotations[annotationLabel.label_id].push(annotation);
                    }
                });
                })
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
