/**
 * The transect thumbnail of the dashboard hot box.
 */
biigle.$viewModel('transect-metadata-upload', function (element) {
    var messages = biigle.$require('messages.store');
    var resource = biigle.$require('api.transectImageMetadata');
    var transectId = biigle.$require('transects.id');

    new Vue({
        el: element,
        data: {
            loading: false,
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

                this.loading = true;
                var data = new FormData();
                data.append('file', this.csv);
                resource.save({id: transectId}, data)
                    .bind(this)
                    .then(this.handleSuccess, this.handleError)
                    .finally(function () {
                        this.loading = false;
                    });
            },
            setCsv: function (event) {
                this.csv = event.target.files[0];
            }
        }
    });
});
