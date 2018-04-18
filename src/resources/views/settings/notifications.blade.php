<h4>Report notifications</h4>
<p class="text-muted">
    Notifications when a report that you requested is ready for download.
</p>
<form id="report-notification-settings">
    <div class="form-group">
        <label class="radio-inline">
            <input type="radio" v-model="settings" value="email"> <strong>Email</strong>
        </label>
        <label class="radio-inline">
            <input type="radio" v-model="settings" value="web"> <strong>Web</strong>
        </label>
        <span v-cloak>
            <loader v-if="loading" :active="true"></loader>
            <span v-else>
                <i v-if="saved" class="glyphicon glyphicon-ok text-success"></i>
                <i v-if="error" class="glyphicon glyphicon-remove text-danger"></i>
            </span>
        </span>
    </div>
</form>

@push('scripts')
<script type="text/javascript">
    biigle.$viewModel('report-notification-settings', function (element) {
        new Vue({
            el: element,
            mixins: [biigle.$require('core.mixins.loader')],
            data: {
                settings: '{!! $user->getSettings('report_notifications', config('reports.notifications.default_settings')) !!}',
                saved: false,
                error: false,
            },
            methods: {
                handleSuccess: function () {
                    this.saved = true;
                    this.error = false;
                },
                handleError: function (response) {
                    this.saved = false;
                    this.error = true;
                    biigle.$require('messages.store').handleErrorResponse(response);
                },
            },
            watch: {
                settings: function (settings) {
                    this.startLoading();
                    this.$http.post('api/v1/users/my/settings/reports', {
                            report_notifications: this.settings,
                        })
                        .then(this.handleSuccess, this.handleError)
                        .finally(this.finishLoading);
                },
            },
        });
    });
</script>
@endpush
