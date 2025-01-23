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
    },
    data() {
        return {
            annotationBadgeCount: 0,
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
    }
};
</script>
