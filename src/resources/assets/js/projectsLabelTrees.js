/**
 * The panel for editing the members of a project
 */
biigle.$viewModel('projects-label-trees', function (element) {
    var messages = biigle.$require('messages.store');
    var project = biigle.$require('projects.project');
    var projectsApi = biigle.$require('api.projects');

    new Vue({
        el: element,
        mixins: [
            biigle.$require('core.mixins.loader'),
            biigle.$require('core.mixins.editor'),
        ],
        components: {
            typeahead: biigle.$require('core.components.typeahead'),
            loader: biigle.$require('core.components.loader'),
        },
        data: {
            labelTrees: [],
            availableLabelTrees: [],
            typeaheadTemplate: '<span v-text="item.name"></span><br><small v-text="item.description"></small>',
        },
        computed: {
            classObject: function () {
                return {
                    'panel-warning': this.editing,
                };
            },
            hasNoLabelTrees: function () {
                return this.labelTrees.length === 0;
            },
            labelTreeIds: function () {
                return this.labelTrees.map(function (tree) {
                    return tree.id;
                });
            },
            attachableLabelTrees: function () {
                var self = this;
                return this.availableLabelTrees.filter(function (tree) {
                    return self.labelTreeIds.indexOf(tree.id) === -1;
                });
            },
        },
        methods: {
            fetchAvailableLabelTrees: function () {
                projectsApi.queryAvailableLabelTrees({id: project.id})
                    .then(this.availableLabelTreesFetched, messages.handleErrorResponse);
            },
            availableLabelTreesFetched: function (response) {
                this.availableLabelTrees = response.data.map(this.parseLabelTreeVersionedName);
            },
            attachTree: function (tree) {
                if (!tree) return;
                this.startLoading();
                var self = this;
                projectsApi.attachLabelTree({id: project.id}, {id: tree.id})
                    .then(function () {
                        self.treeAttached(tree);
                    }, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
            treeAttached: function (tree) {
                for (var i = this.availableLabelTrees.length - 1; i >= 0; i--) {
                    if (this.availableLabelTrees[i].id === tree.id) {
                        this.availableLabelTrees.splice(i, 1);
                    }
                }

                this.labelTrees.push(tree);
            },
            removeTree: function (tree) {
                this.startLoading();
                var self = this;
                projectsApi.detachLabelTree({id: project.id, label_tree_id: tree.id})
                    .then(function () {
                        self.treeRemoved(tree);
                    }, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
            treeRemoved: function (tree) {
                for (var i = this.labelTrees.length - 1; i >= 0; i--) {
                    if (this.labelTrees[i].id === tree.id) {
                        this.labelTrees.splice(i, 1);
                    }
                }

                this.availableLabelTrees.push(tree);
            },
            parseLabelTreeVersionedName: function (tree) {
                if (tree.version) {
                    tree.name = tree.name + ' @ ' + tree.version.name;
                }

                return tree;
            },
        },
        created: function () {
            this.$once('editing.start', this.fetchAvailableLabelTrees);
            this.labelTrees = biigle.$require('projects.labelTrees')
                .map(this.parseLabelTreeVersionedName);
        },
    });
});
