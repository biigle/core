/**
 * The panel for editing the labels of a label tree
 */
biigle.$viewModel('label-trees-labels', function (element) {
    var labels = biigle.$require('api.labels');
    var messages = biigle.$require('messages.store');

    new Vue({
        el: element,
        data: {
            editing: false,
            loading: false,
            labels: biigle.$require('labelTrees.labels'),
        },
        components: {
            typeahead: VueStrap.typeahead,
            tabs: VueStrap.tabs,
            tab: VueStrap.tab,
            labelTree: biigle.$require('labelTrees.components.labelTree'),
        },
        computed: {
            classObject: function () {
                return {
                    'panel-warning': this.editing
                };
            },
            authorizableProjects: function () {
                return [];
            }
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
                for (var i = this.labels.length - 1; i >= 0; i--) {
                    if (this.labels[i].id === label.id) {
                        this.labels.splice(i, 1);
                        break;
                    }
                }
            },
        }
    });
});
