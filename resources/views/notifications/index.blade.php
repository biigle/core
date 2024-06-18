@extends('app')

@section('title', 'Notifications')

@push('scripts')
    <script type="text/javascript">
        biigle.$declare('initialNotifications', {!! $notifications !!})
    </script>
@endpush

@section('content')
<div class="container">
    @include('partials.notification-tabs')
    <div class="row">
        <div class="col-sm-3 col-md-2 col-md-offset-1">
            <ul class="nav nav-pills nav-stacked">
                <li role="presentation" class="@if (!$all) active @endif cf"><a href="{{route('notifications')}}" title="Show unread notifications">Unread <span id="notifications-unread-count" class="badge pull-right" v-cloak v-text="count"></span></a></li>
                <li role="presentation" @if ($all) class="active" @endif><a href="{{route('notifications', ['all' => 1])}}" title="Show all notifications">All notifications</a></li>
            </ul>
        </div>
        <div id="notifications-list" class="col-sm-9 col-md-7 col-md-offset-1" v-cloak>
            @if (!$all)
                <p v-cloak v-if="hasUnreadNotifications" class="clearfix">
                    <button class="btn btn-default btn-s pull-right" v-on:click="markAllAsRead">Mark all as read</button>
                </p>
            @endif
            <notification v-for="item in notifications" v-bind:key="item.id" v-bind:item="item" v-bind:remove-item="{{$all ? 'false': 'true'}}" inline-template>
                <div class="panel" v-bind:class="classObject">
                    <div class="panel-heading">
                        <span class="pull-right">
                            <span v-bind:title="item.created_at" v-text="item.created_at_diff"></span>
                            <button class="btn btn-default btn-xs" title="Mark as read" v-on:click="markRead" v-if="isUnread" v-bind:disabled="isLoading"><i class="fa fa-check"></i></button>
                        </span>
                        <h3 class="panel-title" v-text="item.data.title"></h3>
                    </div>
                    <div class="panel-body">
                        @{{item.data.message}}
                        <p class="notification__action" v-if="item.data.action">
                            <a v-bind:href="item.data.actionLink" v-text="item.data.action" v-on:click.prevent="markReadAndOpenLink" v-bind:title="item.data.action"></a>
                        </p>
                    </div>
                </div>
            </notification>
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
