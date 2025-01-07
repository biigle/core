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
                <i v-if="saved" class="fa fa-check text-success"></i>
                <i v-if="error" class="fa fa-times text-danger"></i>
            </span>
        </span>
    </div>
</form>

@push('scripts')
<script type="text/javascript">
    biigle.$mount('report-notification-settings', {
        mixins: [biigle.$require('core.mixins.notificationSettings')],
        data: {
            settings: '{!! $user->getSettings('report_notifications', config('user_storage.notifications.default_settings')) !!}',
            settingsKey: 'report_notifications',
        },
    });
</script>
@endpush
