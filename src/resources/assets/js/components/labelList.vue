<script>
import LabelItem from './labelListLabelItem';


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
            annotationBadgeCount: 0,
            labelItems: {}
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
            this.labelItems =  this.labels;
            this.annotationBadgeCount = Object.values(this.labels).reduce((acc, l) => {
                return acc + l.count;
            }, 0);
        },
        changedAnnotations() {
            Object.values(this.changedAnnotations).forEach((a) => {
                let oldLabelId = a.oldLabelId;
                let newLabelId = a.newLabelId;

                Vue.set(this.labelItems, oldLabelId, {...this.labelItems[oldLabelId], count: this.labelItems[oldLabelId].count - 1});
                if (newLabelId) {
                    Vue.set(this.labelItems, newLabelId, {...this.labelItems[newLabelId], count: this.labelItems[newLabelId].count + 1});
                } else {
                    this.annotationBadgeCount -= 1;
                }
            });
        },
    }
};
</script>
