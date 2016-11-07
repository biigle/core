@extends('app')

@section('title') Notifications @stop

@section('content')
<div class="container">
    <div class="row">
        <div class="col-sm-12 col-md-10 col-md-offset-1">
            <ul class="nav nav-tabs notification__tabs">
                <li role="presentation" class="active">
                    <a href="{{route('notifications')}}"><span class="glyphicon glyphicon-bell" aria-hidden="true"></span> Notifications</a>
                </li>
                <li role="presentation" class="disabled">
                    <a href="#" title="Show system messages"><span class="glyphicon glyphicon-bullhorn" aria-hidden="true"></span> System messages</a>
                </li>
            </ul>
        </div>
    </div>
    <div class="row">
        <div class="col-sm-3 col-md-2 col-md-offset-1">
            <ul class="nav nav-pills nav-stacked">
                <li role="presentation" class="@if (!$all) active @endif cf"><a href="{{route('notifications')}}" title="Show unread notifications">Unread <span class="badge pull-right">{{$unreadCount}}</span></a></li>
                <li role="presentation" @if ($all) class="active" @endif><a href="{{route('notifications', ['all' => 1])}}" title="Show all notifications">All notifications</a></li>
            </ul>
        </div>
        <div class="col-sm-9 col-md-7 col-md-offset-1">
            @forelse($notifications as $notification)
                <div class="panel @if(array_key_exists('type', $notification->data))panel-{{$notification->data['type']}}@else panel-default @endif">
                    <div class="panel-heading">
                        <span class="pull-right" title="{{$notification->created_at}}">{{$notification->created_at->diffForHumans()}}</span>
                        <h3 class="panel-title">{{$notification->data['title']}}</h3>
                    </div>
                    <div class="panel-body">
                        {{$notification->data['message']}}
                        @if (array_key_exists('action', $notification->data))
                            <p class="notification__action">
                                <a href="{{$notification->data['actionLink']}}">{{$notification->data['action']}}</a>
                            </p>
                        @endif
                    </div>
                </div>
            @empty
                <p class="text-muted">
                    @if ($all)
                        You have no notifications.
                    @else
                        You have no unread notifications.
                    @endif
                </p>
            @endforelse
        </div>
    </div>
</div>
@endsection
