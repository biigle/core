@extends('admin.base')

@section('title', "{$shownUser->firstname} {$shownUser->lastname} - User Information")

@section('admin-content')
<h2 class="col-xs-12 no-margin">
    @if ($user->id !== $shownUser->id)
        <a class="btn btn-default pull-right" href="{{route('admin-users-edit', $shownUser->id)}}" title="Edit {{$shownUser->firstname}} {{$shownUser->lastname}}">Edit</a>
    @endif
    {{$shownUser->firstname}} {{$shownUser->lastname}}
    <small>
        {{$shownUser->email}}
        <span class="label label-{{$roleClass}}">{{ucfirst($shownUser->role->name)}}</span>
    </small>
</h2>
<p class="col-xs-12 clearfix">
    <code class="pull-right">{{$shownUser->uuid}}</code>
    @if ($shownUser->affiliation)
        {{$shownUser->affiliation}}<br>
    @endif
    <span class="text-muted">
        @if ($shownUser->login_at)
            <span title="{{$shownUser->login_at}}">active {{$shownUser->login_at->diffForHumans()}}</span>
        @else
            never logged in
        @endif
    </span>
</p>

@mixin('adminShowUser')
@endsection
