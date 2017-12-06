@extends('app')

@section('title', 'System messages')

@section('content')
<div class="container">
    @include('partials.notification-tabs')
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
            <ul class="list-unstyled">
                @forelse ($messages as $message)
                    <li>
                        <strong><a href="{{route('system-messages-show', $message->id)}}">{{$message->title}}</a></strong>
                        @unless($type)
                            <span class="label label-{{$typeClasses[$message->type_id]}}">{{$message->type->name}}</span>
                        @endunless
                        <p class="text-muted">
                            Published <span title="{{$message->published_at}}">{{$message->published_at->diffForHumans()}}</span>
                        </p>
                    </li>
                @empty
                    <li class="text-muted">
                        @if ($type !== null)
                            There are no system messages of this type.
                        @else
                            There are no system messages yet.
                        @endif
                    </li>
                @endforelse
            </ul>
            <nav class="text-center">
                {{$messages->links()}}
            </nav>
        </div>
    </div>
</div>
@endsection
