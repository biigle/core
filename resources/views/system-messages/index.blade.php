@extends('app')

@section('title') System messages @stop

@section('content')
<div class="container">
    <div class="row">
        <div class="col-sm-12 col-md-10 col-md-offset-1">
            <ul class="nav nav-tabs notification__tabs">
                <li role="presentation">
                    <a href="{{route('notifications')}}"><span class="glyphicon glyphicon-bell" aria-hidden="true"></span> Notifications</a>
                </li>
                <li role="presentation" class="active">
                    <a href="{{route('system-messages')}}" title="Show system messages"><span class="glyphicon glyphicon-bullhorn" aria-hidden="true"></span> System messages</a>
                </li>
            </ul>
        </div>
    </div>
    <div class="row">
        <div class="col-sm-3 col-md-2 col-md-offset-1">
            <ul class="nav nav-pills nav-stacked">
                <li role="presentation" class="@if ($type === null) active @endif"><a href="{{route('system-messages')}}" title="Show all system messages">All</a></li>
                @foreach ($types as $t)
                    <li role="presentation" class="@if ($type == $t->id) active @endif"><a href="{{route('system-messages', ['type' => $t->id])}}" title="Show {{$t->name}} system messages">{{ucfirst($t->name)}}</a></li>
                @endforeach
            </ul>
        </div>
        <div class="col-sm-9 col-md-7 col-md-offset-1">
            @forelse ($messages as $message)
                <h3>
                    <a href="{{route('system-messages-show', $message->id)}}">
                        {{$message->title}}
                        <span class="pull-right label label-{{$typeClasses[$message->type_id]}}">{{$message->type->name}}</span>
                    </a>
                </h3>
            @empty
                <p class="text-muted">
                    There are no system messages yet.
                </p>
            @endforelse
        </div>
    </div>
</div>
@endsection
