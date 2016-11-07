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
        @foreach ($users as $user)
            <tr @if (session('newUser') && session('newUser')->id === $user->id) class="bg-success" @endif>
                <td>{{$user->firstname}} {{$user->lastname}}</td>
                <td><a href="mailto:{{$user->email}}">{{$user->email}}</a></td>
                <td>{{ucfirst($user->role->name)}}</td>
                <td>
                    @if ($user->login_at)
                        <time datetime="{{$user->login_at->toAtomString()}}" title="{{$user->login_at->toDateTimeString()}}">{{$user->login_at->diffForHumans()}}</time>
                    @else
                        <span class="text-muted">none</span>
                    @endif
                </td>
                <td>
                    @if ($user->id !== $user->id)
                        <a class="btn btn-default btn-xs" href="{{route('admin-users-edit', $user->id)}}" title="Edit {{$user->firstname}} {{$user->lastname}}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                    @endif
                </td>
            </tr>
        @endforeach
    </tbody>
</table>
@endsection
