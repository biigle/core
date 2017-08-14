@extends('app')

@section('title', "System messages - {$message->title}")

@section('content')
<div class="container">
    @include('partials.notification-tabs')
    <div class="row">
        <div class="col-sm-3 col-md-2 col-md-offset-1">
            <ul class="nav nav-pills nav-stacked">
                <li role="presentation"><a href="{{route('system-messages')}}" title="Back to all system messages">Back</a></li>
            </ul>
        </div>
        <div class="col-sm-9 col-md-7 col-md-offset-1">
            <h2>{{$message->title}}</h2>
            <p class="text-muted">
                <span class="label label-{{$typeClasses[$message->type_id]}}">{{$message->type->name}}</span> Published on {{$message->published_at}}
            </p>
            {!!$message->body!!}
        </div>
    </div>
</div>
@endsection
