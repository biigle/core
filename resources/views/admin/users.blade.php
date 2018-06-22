@extends('admin.base')

@section('title', 'Users admin area')

@section('admin-content')
@if (session('deleted'))
    <div class="alert alert-success" role="alert">
        The user was deleted.
    </div>
@endif
<a href="{{route('admin-users-new')}}" class="btn btn-default" title="Create a new user">New user</a>
<table class="table table-hover">
    <thead>
        <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Affiliation</th>
            <th>Activity</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($activeUsers as $u)
            <tr>
                <td>
                    <a href="{{route('admin-users-show', $u->id)}}">{{$u->firstname}} {{$u->lastname}}</a>
                </td>
                <td><a href="mailto:{{$u->email}}">{{$u->email}}</a></td>
                <td>
                    @if ($u->affiliation)
                        {{$u->affiliation}}
                    @else
                        <span class="text-muted">none</span>
                    @endif
                </td>
                <td>
                    <time datetime="{{$u->login_at->toAtomString()}}" title="{{$u->login_at->toDateTimeString()}}">{{$u->login_at->diffForHumans()}}</time>
                </td>
            </tr>
        @endforeach
    </tbody>
</table>

@if ($inactiveUsers->count() > 0)
    <p>
        Users who didn't perform a login yet:
    </p>
    <table class="table table-hover">
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Affiliation</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($inactiveUsers as $u)
                <tr @if (session('newUser') && session('newUser')->id === $u->id) class="bg-success" @endif>
                    <td><a href="{{route('admin-users-show', $u->id)}}">{{$u->firstname}} {{$u->lastname}}</a></td>
                    <td><a href="mailto:{{$u->email}}">{{$u->email}}</a></td>
                    <td>{{$u->affiliation}}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endif
@endsection
