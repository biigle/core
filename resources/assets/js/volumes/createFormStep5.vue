<script>
import LabelApi from '../core/api/labels';
import LabelMapping from './components/labelMapping';
import LoaderMixin from '../core/mixins/loader';

export default {
    mixins: [LoaderMixin],
    components: {
        labelMapping: LabelMapping,
    },
    data() {
        return {
            labels: [],
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
            let labels = [];

            this.labelTrees.forEach(function (tree) {
                tree.labels.forEach(function (label) {
                    label.labelTreeName = tree.name;
                });
                Array.prototype.push.apply(labels, tree.labels);
            });

            return labels;
        },
        flatTrees() {
            return this.labelTrees.map(t => {
                return {id: t.id, name: t.name};
            });
        },
        mappedLabels() {
            return this.labels.filter(l => l.mappedLabel);
        },
    },
    methods: {
        handleSelect(label, id) {
            label.mappedLabel = id;
        },
        handleCreate(metaLabel, treeId, newLabel) {
            this.startLoading();
            LabelApi.save({label_tree_id: treeId}, newLabel)
                .then(
                    (response) => this.handleCreatedLabel(metaLabel, response.body[0]),
                    this.handleErrorResponse
                )
                .finally(this.finishLoading);
        },
        handleCreatedLabel(metaLabel, newLabel) {
            const tree = this.labelTrees.find(t => t.id === newLabel.label_tree_id);
            tree.labels.push(newLabel);
            this.handleSelect(metaLabel, newLabel.id);
        },
    },
    created() {
        const labelMap = biigle.$require('volumes.labelMap');

        this.labels = biigle.$require('volumes.labels').map((label) => {
            label.mappedLabel = labelMap[label.id];

            return label;
        });

        this.labelTrees = biigle.$require('volumes.labelTrees');
    },
};
</script>
