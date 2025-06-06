<script>
import Events from '@/core/events.js';
import LabelsApi from '@/core/api/labels.js';
import LabelTree from './components/labelTree.vue';
import LoaderMixin from '@/core/mixins/loader.vue';
import ManualLabelForm from './components/manualLabelForm.vue';
import WormsLabelForm from './components/wormsLabelForm.vue';
import {handleErrorResponse} from '@/core/messages/store.js';
import {randomColor} from './utils.js';
import {Tabs, Tab} from 'uiv';

/**
 * The panel for editing the labels of a label tree
 */
export default {
    emits: [
        'clear',
        'deselect',
        'select',
    ],
    mixins: [
        LoaderMixin,
    ],
    data() {
        return {
            labelTree: null,
            labels: [],
            selectedColor: randomColor(),
            selectedLabel: null,
            selectedName: '',
            canEdit: false,
        };
    },
    components: {
        tabs: Tabs,
        tab: Tab,
        labelTree: LabelTree,
        manualLabelForm: ManualLabelForm,
        wormsLabelForm: WormsLabelForm,
    },
    computed: {
        editable() {
            return !this.loading && this.canEdit;
        },
        labelCount() {
            return this.labels.length;
        },
    },
    methods: {
        saveLabel(label, reject) {
            this.startLoading();
            LabelsApi.update({id: label.id}, {name: label.name, color: label.color})
                .catch(function (response) {
                    reject();
                    handleErrorResponse(response);
                })
                .finally(this.finishLoading);
        },
        deleteLabel(label) {
            this.startLoading();
            LabelsApi.delete({id: label.id})
                .then(() => {
                    this.labelDeleted(label);
                }, handleErrorResponse)
                .finally(this.finishLoading);
        },
        labelDeleted(label) {
            if (this.selectedLabel && this.selectedLabel.id === label.id) {
                this.deselectLabel(label);
            }

            for (let i = this.labels.length - 1; i >= 0; i--) {
                if (this.labels[i].id === label.id) {
                    this.labels.splice(i, 1);
                    break;
                }
            }
        },
        selectLabel(label) {
            this.selectedLabel = label;
            // Emit these events in the global event bus, too, so they can be caught
            // by components in view mixins on this page.
            if (!label) {
                this.$emit('clear');
                Events.emit('selectLabel', null);
            } else {
                this.selectedColor = '#' + label.color;
                this.$emit('select', label);
                Events.emit('selectLabel', label);
            }
        },
        deselectLabel(label) {
            this.selectedLabel = null;
            this.$emit('deselect', label);
            Events.emit('selectLabel', null);
        },
        selectColor(color) {
            this.selectedColor = color;
        },
        selectName(name) {
            this.selectedName = name;
        },
        insertLabel(label) {
            label.open = false;
            label.selected = false;
            let name = label.name.toLowerCase();
            // add the label to the array so the labels remain sorted by their name
            for (let i = 0, length = this.labels.length; i < length; i++) {
                if (this.labels[i].name.toLowerCase() >= name) {
                    this.labels.splice(i, 0, label);
                    return;
                }
            }
            // If the function didn't return by now the label is "smaller" than all
            // the other labels.
            this.labels.push(label);
        },
        createLabel(label) {
            if (this.loading) {
                return;
            }

            this.startLoading();
            LabelsApi.save({label_tree_id: this.labelTree.id}, label)
                .then(this.labelCreated, handleErrorResponse)
                .finally(this.finishLoading);
        },
        labelCreated(response) {
            response.data.forEach(this.insertLabel);
            this.selectedColor = randomColor();
            this.selectedName = '';
        },
    },
    watch: {
        labelCount(count) {
            Events.emit('label-trees.labels.count', count);
        },
    },
    created() {
        this.labelTree = biigle.$require('labelTrees.labelTree');
        this.labels = biigle.$require('labelTrees.labels');
        this.canEdit = biigle.$require('labelTrees.canEdit');
    },
};
</script>
