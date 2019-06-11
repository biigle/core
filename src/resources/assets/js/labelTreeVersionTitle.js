/**
 * The panel for editing the information of a label tree version
 */
biigle.$viewModel('label-tree-version-title', function (element) {
    var messages = biigle.$require('messages.store');
    var version = biigle.$require('labelTrees.version');
    var labelTreeVersionApi = biigle.$require('api.labelTreeVersion');

    new Vue({
        el: element,
        mixins: [biigle.$require('core.mixins.loader')],
        methods: {
            deleteVersion: function () {
                this.startLoading();
                labelTreeVersionApi.delete({id: version.id})
                    .then(this.deleteSuccess, this.handleErrorResponse);
            },
            deleteSuccess: function () {
                messages.success('The label tree version was deleted. Redirecting...');
                setTimeout(function () {
                    location.href = biigle.$require('labelTrees.redirectUrl');
                 }, 2000);
            },
        }
    });
});
