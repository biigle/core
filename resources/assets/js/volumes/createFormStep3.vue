<script>
import LoaderMixin from '@/core/mixins/loader.vue';
import LabelTrees from '@/label-trees/components/labelTrees.vue';


export default {
    mixins: [LoaderMixin],
    components: {
        LabelTrees
    },
    data() {
        return {
            labels: [],
        };
    },
    computed: {
        labelTrees() {
            return [{
                name: 'Metadata annotation labels',
                labels: this.labels,
            }];
        },
        cannotContinue() {
            return this.loading || this.selectedLabels.length === 0;
        },
        selectedLabels() {
            return this.labels.filter(l => l.selected);
        },
        allSelected() {
            return this.labels.length === this.selectedLabels.length;
        },
    },
    methods: {
        //
    },
    created() {
        this.labels = biigle.$require('volumes.labels').map(function (l) {
            l.parent_id = null;
            l.selected = true;

            return l;
        });
    },
};
</script>
