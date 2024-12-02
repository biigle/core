<script>
import LabelItem from './annotationTabLabelItem';


export default {
    components: {
        labelItem: LabelItem,
    },
    props: {
        labels: {
            type: Object,
            default() {
                return {};
            },
        },
        changedAnnotations: {
            type: Object,
            default() {
                return {};
            }
        },
    },
    data() {
        return {
            annotationBadgeCount: 0
        };
    },
    methods: {
        handleSelectedLabel(label) {
            this.$emit('select', label);
        },
        handleDeselectedLabel() {
            this.$emit('deselect');
        },
    },
    watch: {
        labels() {
            this.annotationBadgeCount = Object.values(this.labels).reduce((acc, l) => {
                return acc + l.count;
            }, 0);
        },
        changedAnnotations() {
            Object.values(this.changedAnnotations).forEach((a) => {
                let oldLabelId = a.oldLabelId;
                let newLabelId = a.newLabelId;
                this.labels[oldLabelId].count -= 1;
                if (newLabelId) {
                    this.labels[newLabelId].count += 1;
                } else {
                    this.annotationBadgeCount -= 1;
                }
            });
        },
    }
};
</script>
