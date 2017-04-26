@extends('app')

@section('title') Notifications @stop

@push('scripts')
    <script type="text/javascript">
        biigle.notifications.store.all = {!! $notifications !!};
    </script>
@endpush

@section('content')
<div class="container">
    <div class="row">
        <div class="col-sm-12 col-md-10 col-md-offset-1">
            <ul class="nav nav-tabs notification__tabs">
                <li role="presentation" class="active">
                    <a href="{{route('notifications')}}"><span class="glyphicon glyphicon-bell" aria-hidden="true"></span> Notifications</a>
                </li>
                <li role="presentation">
                    <a href="{{route('system-messages')}}" title="Show system messages"><span class="glyphicon glyphicon-bullhorn" aria-hidden="true"></span> System messages</a>
                </li>
            </ul>
        </div>
    </div>
    <div class="row">
        <div class="col-sm-3 col-md-2 col-md-offset-1">
            <ul class="nav nav-pills nav-stacked">
                <li role="presentation" class="@if (!$all) active @endif cf"><a href="{{route('notifications')}}" title="Show unread notifications">Unread <span id="notifications-unread-count" class="badge pull-right" v-cloak v-text="count"></span></a></li>
                <li role="presentation" @if ($all) class="active" @endif><a href="{{route('notifications', ['all' => 1])}}" title="Show all notifications">All notifications</a></li>
            </ul>
        </div>
        <div id="notifications-list" class="col-sm-9 col-md-7 col-md-offset-1" v-cloak>
            <notification v-for="item in notifications" v-bind:item="item" v-bind:remove-item="{{$all ? 'false': 'true'}}" inline-template>
                <div class="panel" v-bind:class="classObject">
                    <div class="panel-heading">
                        <span class="pull-right">
                            <span v-bind:title="item.created_at" v-text="item.created_at_diff"></span>
                            <button class="btn btn-default btn-xs" title="Mark as read" v-on:click="markRead" v-if="isUnread" v-bind:disabled="isLoading"><i class="glyphicon glyphicon-ok"></i></button>
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
            <p class="text-muted" v-if="!hasNotifications()" v-cloak>
                @if ($all)
                    You have no notifications.
                @else
                    You have no unread notifications.
                @endif
            </p>
        </div>
    </div>
</div>
@endsection
