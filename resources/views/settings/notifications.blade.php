@extends('settings.base')
@inject('modules', 'Biigle\Services\Modules')

@section('title', 'Notification settings')

@section('settings-content')
<h2>Notifications</h2>
<p>
    Choose how you receive notifications. <strong>Email</strong> will send you an email for each new notification. <strong>Web</strong> will send the notification to your BIIGLE <a href="{{route('notifications')}}"><i class="fa fa-bell"></i> notification center</a>.
</p>
<div class="panel panel-default">
    <ul class="list-group">
        <li class="list-group-item">
            <h4>Report notifications</h4>
            <p class="text-muted">
                Notifications when a report that you requested is ready for download.
            </p>
            <form id="report-notification-settings">
                <div class="form-group">
                    @if (config('reports.notifications.allow_user_settings'))
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
                    @else
                        {{ucfirst(config('reports.notifications.default_settings'))}} <span class="text-muted">(fixed by admin)</span>
                    @endif
                </div>
            </form>
        </li>
        @foreach ($modules->getMixins('settings.notifications') as $module => $nestedMixins)
            <li class="list-group-item">
                @include($module.'::settings.notifications')
            </li>
        @endforeach
    </ul>
</div>
@endsection

@push('scripts')
<script type="module">
    biigle.$mount('report-notification-settings', {
        mixins: [biigle.$require('core.mixins.notificationSettings')],
        data: {
            settings: '{!! $user->getSettings('report_notifications', config('reports.notifications.default_settings')) !!}',
            settingsKey: 'report_notifications',
        },
    });
</script>
@endpush
