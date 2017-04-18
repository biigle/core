/**
 * View model for the main Largo container
 */
biigle.$viewModel('largo-container', function (element) {
    var volumesApi = biigle.$require('largo.api.volumes');
    var volumeId = biigle.$require('largo.volumeId');

    new Vue({
        el: element,
        mixins: [biigle.$require('largo.mixins.largoContainer')],
        data: {
            labelTrees: biigle.$require('largo.labelTrees'),
        },
        methods: {
            queryAnnotations: function (label) {
                return volumesApi.queryAnnotations({id: volumeId, label_id: label.id});
            },
            performSave: function (dismissed, changed) {
                return volumesApi.save({id: volumeId}, {
                    dismissed: dismissed,
                    changed: changed,
                });
            },
        },
    });
});
