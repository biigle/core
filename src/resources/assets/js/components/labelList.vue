<script>
import LabelItem from './labelListLabelItem.vue';


export default {
    components: {
        labelItem: LabelItem,
    },
    props: {
        labels: {
            type: Array,
            default() {
                return [];
            },
        },
    },
    computed: {
        annotationBadgeCount() {
            return this.labels.reduce((acc, l) => {
                return acc + l.count;
            }, 0);
        },
    },
    methods: {
        handleSelectedLabel(label) {
            this.$emit('select', label);
        },
        handleDeselectedLabel() {
            this.$emit('deselect');
        },
    },
};
</script>
