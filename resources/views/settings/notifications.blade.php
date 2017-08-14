@extends('settings.base')
@inject('modules', 'Biigle\Services\Modules')

@section('title', 'Notification settings')

@section('settings-content')
<h2>Notifications</h2>
<p>
    Choose how you receive notifications. <strong>Email</strong> will send you an email for each new notification. <strong>Web</strong> will send the notification to your BIIGLE <a href="{{route('notifications')}}"><i class="glyphicon glyphicon-bell"></i> notification center</a>.
</p>
<div class="panel panel-default">
    @forelse ($modules->getMixins('settings.notifications') as $module => $nestedMixins)
        <ul class="list-group">
            <li class="list-group-item">
                @include($module.'::settings.notifications')
            </li>
        </ul>
    @empty
        <div class="panel-body text-muted">
            There are no notification settings that you can change right now.
        </div>
    @endforelse
</div>
@endsection
