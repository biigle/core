@extends('admin.base')

@section('title')Users admin area @stop

@section('admin-content')
@if (session('deleted'))
    <div class="alert alert-success" role="alert">
        The user was deleted.
    </div>
@endif
<a href="{{route('admin-users-new')}}" class="btn btn-default" title="Create a new user"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span> New user</a>
<table class="table table-hover">
    <thead>
        <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Activity</th>
            <th></th>
        </tr>
    </thead>
    <tbody>
        @foreach ($activeUsers as $u)
            <tr>
                <td>{{$u->firstname}} {{$u->lastname}}</td>
                <td><a href="mailto:{{$u->email}}">{{$u->email}}</a></td>
                <td>{{ucfirst($u->role->name)}}</td>
                <td>
                    <time datetime="{{$u->login_at->toAtomString()}}" title="{{$u->login_at->toDateTimeString()}}">{{$u->login_at->diffForHumans()}}</time>
                </td>
                <td>
                    @if ($user->id !== $u->id)
                        <a class="btn btn-default btn-xs pull-right" href="{{route('admin-users-edit', $u->id)}}" title="Edit {{$u->firstname}} {{$u->lastname}}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                    @endif
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
                <th>Role</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
            @foreach ($inactiveUsers as $u)
                <tr @if (session('newUser') && session('newUser')->id === $u->id) class="bg-success" @endif>
                    <td>{{$u->firstname}} {{$u->lastname}}</td>
                    <td><a href="mailto:{{$u->email}}">{{$u->email}}</a></td>
                    <td>{{ucfirst($u->role->name)}}</td>
                    <td>
                        <a class="btn btn-default btn-xs pull-right" href="{{route('admin-users-edit', $u->id)}}" title="Edit {{$u->firstname}} {{$u->lastname}}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endif
@endsection
