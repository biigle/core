<script>
import Events from '../core/events';
import LabelTreeList from './components/labelTreeList';
import LoaderMixin from '../core/mixins/loader';
import ProjectsApi from '../core/api/projects';
import {handleErrorResponse} from '../core/messages/store';
import ScrollableTypeahead from '../core/components/scrollableTypeahead.vue';

export default {
    mixins: [LoaderMixin],
    components: {
        scrollableTypeahead: ScrollableTypeahead,
        labelTreeList: LabelTreeList,
    },
    data() {
        return {
            project: null,
            canEdit: false,
            labelTrees: [],
            fetchedAvailableLabelTrees: false,
            availableLabelTrees: [],
            oldTreeName: "",
        };
    },
    computed: {
        hasLabelTrees() {
            return this.labelTrees.length > 0;
        },
        labelTreeIds() {
            return this.labelTrees.map((tree) => tree.id);
        },
        attachableLabelTrees() {
            return this.availableLabelTrees.filter(
                (tree) => this.labelTreeIds.indexOf(tree.id) === -1
            );
        },
    },
    methods: {
        fetchAvailableLabelTrees(treeName) {
            if (this.oldTreeName.trim() != treeName.trim()) {
                this.fetchedAvailableLabelTrees = true;
                this.startLoading();
                ProjectsApi.queryAvailableLabelTrees({ id: this.project.id, name: treeName })
                    .then(this.availableLabelTreesFetched, handleErrorResponse)
                    .finally(() => {
                        this.finishLoading();
                        this.oldTreeName = treeName;
                    });
            }
        },
        availableLabelTreesFetched(response) {
            this.availableLabelTrees = response.data.map(this.parseLabelTreeVersionedName);
        },
        attachTree(tree) {
            if (!tree) return;
            this.startLoading();
            ProjectsApi.attachLabelTree({id: this.project.id}, {id: tree.id})
                .then(() => this.treeAttached(tree), handleErrorResponse)
                .finally(this.finishLoading);
        },
        treeAttached(tree) {
            for (let i = this.availableLabelTrees.length - 1; i >= 0; i--) {
                if (this.availableLabelTrees[i].id === tree.id) {
                    this.availableLabelTrees.splice(i, 1);
                }
            }

            this.labelTrees.push(tree);
        },
        removeTree(tree) {
            this.startLoading();
            ProjectsApi.detachLabelTree({id: this.project.id, label_tree_id: tree.id})
                .then(() => this.treeRemoved(tree), handleErrorResponse)
                .finally(this.finishLoading);
        },
        treeRemoved(tree) {
            for (let i = this.labelTrees.length - 1; i >= 0; i--) {
                if (this.labelTrees[i].id === tree.id) {
                    this.labelTrees.splice(i, 1);
                }
            }

            this.availableLabelTrees.push(tree);
        },
        parseLabelTreeVersionedName(tree) {
            if (tree.version) {
                tree.name = tree.name + ' @ ' + tree.version.name;
            }

            return tree;
        },
    },
    watch: {
        labelTrees(labelTrees) {
            Events.$emit('project.label-trees.count', labelTrees.length)
        },
    },
    created() {
        this.canEdit = biigle.$require('projects.canEdit');
        this.labelTrees = biigle.$require('projects.labelTrees')
            .map(this.parseLabelTreeVersionedName);
        this.project = biigle.$require('projects.project');
    },
};
</script>
