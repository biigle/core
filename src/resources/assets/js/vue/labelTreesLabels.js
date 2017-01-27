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
        data: {
            editing: true,
            loading: false,
            labels: biigle.$require('labelTrees.labels'),
            selectedColor: randomColor(),
            selectedLabel: null,
            selectedName: '',
        },
        components: {
            typeahead: VueStrap.typeahead,
            tabs: VueStrap.tabs,
            tab: VueStrap.tab,
            labelTree: biigle.$require('labelTrees.components.labelTree'),
            manualLabelForm: biigle.$require('labelTrees.components.manualLabelForm'),
        },
        computed: {
            classObject: function () {
                return {
                    'panel-warning': this.editing
                };
            },
        },
        methods: {
            toggleEditing: function () {
                this.editing = !this.editing;
            },
            finishLoading: function () {
                this.loading = false;
            },
            deleteLabel: function (label) {
                var self = this;
                this.loading = true;
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
            createLabel: function () {
                if (this.loading) {
                    return;
                }

                this.loading = true;
                var self = this;
                var label = {
                    name: this.selectedName,
                    color: this.selectedColor,
                };

                if (this.selectedLabel) {
                    label.parent_id = this.selectedLabel.id;
                }

                labels.save({label_tree_id: labelTree.id}, label)
                    .then(this.labelCreated, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
            labelCreated: function (response) {
                this.insertLabel(response.data[0]);
                this.selectedColor = randomColor();
            }
        }
    });
});
