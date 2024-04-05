<script>
import LoaderMixin from '../core/mixins/loader';
import LabelMapping from './components/labelMapping';

export default {
    mixins: [LoaderMixin],
    components: {
        labelMapping: LabelMapping,
    },
    data() {
        return {
            labels: [],
            labelMap: {},
            labelTrees: [],
        };
    },
    computed: {
        cannotContinue() {
            return this.loading || this.hasDanglingLabels;
        },
        hasDanglingLabels() {
            return this.danglingLabels.length > 0;
        },
        danglingLabels() {
            return this.labels.filter(l => l.mappedLabel === null);
        },
        flatLabels() {
            let labels = {};
            this.labelTrees.forEach(function (tree) {
                tree.labels.forEach(function (label) {
                    labels[label.id] = label;
                });
            });

            return labels;
        }
    },
    methods: {
        //
    },
    created() {
        this.labelMap = biigle.$require('volumes.labelMap');

        this.labels = biigle.$require('volumes.labels').map((label) => {
            label.mappedLabel = this.labelMap[label.id];

            return label;
        });

        this.labelTrees = biigle.$require('volumes.labelTrees');
    },
};
</script>
