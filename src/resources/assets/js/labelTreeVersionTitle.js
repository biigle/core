/**
 * The panel for editing the information of a label tree version
 */
biigle.$viewModel('label-tree-version-title', function (element) {
    var version = biigle.$require('labelTrees.version');

    new Vue({
        el: element,
        mixins: [biigle.$require('core.mixins.loader')],
        methods: {
            confirmDeletion: function (e) {
                if (confirm('Do you really want to delete version' + version.name + ' of this label tree?')) {
                    this.startLoading();
                } else {
                    e.preventDefault();
                }
            },
        }
    });
});
