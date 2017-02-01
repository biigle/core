/**
 * The panel for editing the labels of a label tree
 */
biigle.$viewModel('label-trees-labels', function (element) {
    var labels = biigle.$require('api.labels');
    var messages = biigle.$require('messages.store');
    var randomColor = biigle.$require('labelTrees.randomColor');
    var labelTree = biigle.$require('labelTrees.labelTree');

    new Vue({
        el: element,
        mixins: [
            biigle.$require('core.mixins.loader'),
            biigle.$require('core.mixins.editor'),
        ],
        data: {
            labels: biigle.$require('labelTrees.labels'),
            selectedColor: randomColor(),
            selectedLabel: null,
            selectedName: '',
        },
        components: {
            tabs: VueStrap.tabs,
            tab: VueStrap.tab,
            labelTree: biigle.$require('labelTrees.components.labelTree'),
            manualLabelForm: biigle.$require('labelTrees.components.manualLabelForm'),
            wormsLabelForm: biigle.$require('labelTrees.components.wormsLabelForm'),
        },
        computed: {
            classObject: function () {
                return {
                    'panel-warning': this.editing
                };
            },
        },
        methods: {
            deleteLabel: function (label) {
                var self = this;
                this.startLoading();
                labels.delete({id: label.id})
                    .then(function () {
                        self.labelDeleted(label);
                    }, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
            labelDeleted: function (label) {
                if (this.selectedLabel && this.selectedLabel.id === label.id) {
                    this.deselectLabel(label);
                }

                for (var i = this.labels.length - 1; i >= 0; i--) {
                    if (this.labels[i].id === label.id) {
                        this.labels.splice(i, 1);
                        break;
                    }
                }
            },
            selectLabel: function (label) {
                this.selectedLabel = label;
                if (!label) {
                    this.$emit('clear');
                } else {
                    this.selectedColor = '#' + label.color;
                    this.$emit('select', label);
                }
            },
            deselectLabel: function (label) {
                this.selectedLabel = null;
                this.$emit('deselect', label);
            },
            selectColor: function (color) {
                this.selectedColor = color;
            },
            selectName: function (name) {
                this.selectedName = name;
            },
            insertLabel: function (label) {
                Vue.set(label, 'open', false);
                Vue.set(label, 'selected', false);
                var name = label.name.toLowerCase();
                // add the label to the array so the labels remain sorted by their name
                for (var i = 0, length = this.labels.length; i < length; i++) {
                    if (this.labels[i].name.toLowerCase() >= name) {
                        this.labels.splice(i, 0, label);
                        return;
                    }
                }
                // If the function didn't return by now the label is "smaller" than all
                // the other labels.
                this.labels.push(label);
            },
            createLabel: function (label) {
                if (this.loading) {
                    return;
                }

                this.startLoading();
                labels.save({label_tree_id: labelTree.id}, label)
                    .then(this.labelCreated, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
            labelCreated: function (response) {
                response.data.forEach(this.insertLabel);
                this.selectedColor = randomColor();
                this.selectedName = '';
            }
        }
    });
});
