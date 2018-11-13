/**
 * The metadata upload of the volume edit page.
 */
biigle.$viewModel('volume-metadata-upload', function (element) {
    var messages = biigle.$require('messages.store');
    var resource = biigle.$require('api.volumeImageMetadata');
    var volumeId = biigle.$require('volumes.id');

    new Vue({
        el: element,
        mixins: [biigle.$require('core.mixins.loader')],
        data: {
            csv: undefined,
            error: false,
            success: false,
            message: undefined
        },
        methods: {
            handleSuccess: function () {
                this.error = false;
                this.success = true;
            },
            handleError: function (response) {
                this.success = false;
                if (response.data.file) {
                    if (Array.isArray(response.data.file)) {
                        this.error = response.data.file[0];
                    } else {
                        this.error = response.data.file;
                    }
                } else {
                    messages.handleErrorResponse(response);
                }
            },
            submit: function (e) {
                if (!this.csv) return;

                this.startLoading();
                var data = new FormData();
                data.append('file', this.csv);
                resource.save({id: volumeId}, data)
                    .bind(this)
                    .then(this.handleSuccess, this.handleError)
                    .finally(this.finishLoading);
            },
            setCsv: function (event) {
                this.csv = event.target.files[0];
            }
        }
    });
});
