@extends('app')

@section('title', 'Notifications')

@push('scripts')
    <script type="module">
        biigle.$declare('initialNotifications', {!! $notifications !!})
    </script>
@endpush

@section('content')
<div class="container">
    @include('partials.notification-tabs')
    <div class="row">
        <div class="col-sm-3 col-md-2 col-md-offset-1">
            <ul class="nav nav-pills nav-stacked">
                <li role="presentation" class="@if (!$all) active @endif cf"><a href="{{route('notifications')}}" title="Show unread notifications">Unread <span id="notifications-unread-count" class="badge pull-right" v-cloak></span></a></li>
                <li role="presentation" @if ($all) class="active" @endif><a href="{{route('notifications', ['all' => 1])}}" title="Show all notifications">All notifications</a></li>
            </ul>
        </div>
        <div id="notifications-list" class="col-sm-9 col-md-7 col-md-offset-1" v-cloak>
            @if (!$all)
                <p v-cloak v-if="hasUnreadNotifications" class="clearfix">
                    <button class="btn btn-default btn-s pull-right" v-on:click="markAllAsRead" v-bind:disabled="isLoading">Mark all as read</button>
                </p>
            @endif
            <notification v-for="item in notifications" v-bind:key="item.id" v-bind:item="item" v-bind:remove-item="{{$all ? 'false': 'true'}}"></notification>
            @if ($all)
                <p class="text-muted" v-if="!hasNotifications" v-cloak>
                    You have no notifications.
                </p>
            @else
                <p class="text-muted" v-if="!hasUnreadNotifications" v-cloak>
                    You have no unread notifications.
                </p>
            @endif
        </div>
    </div>
</div>
@endsection
