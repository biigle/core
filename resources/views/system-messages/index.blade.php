@extends('app')

@section('title') System messages @stop

@section('content')
<div class="container">
    @include('system-messages.nav')
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
                <h2><a href="{{route('system-messages-show', $message->id)}}">{{$message->title}}</a></h2>
                <p class="text-muted">
                    <span class="label label-{{$typeClasses[$message->type_id]}}">{{$message->type->name}}</span> Published on {{$message->published_at}}
                </p>
            @empty
                <p class="text-muted">
                    @if ($type !== null)
                        There are no system messages of this type.
                    @else
                        There are no system messages yet.
                    @endif
                </p>
            @endforelse
        </div>
    </div>
</div>
@endsection
