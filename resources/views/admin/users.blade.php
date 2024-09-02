@extends('admin.base')

@section('title', 'Users admin area')

@section('admin-content')
@if (session('deleted'))
    <div class="alert alert-success" role="alert">
        The user was deleted.
    </div>
@endif
<div class="clearfix">
    <form class="form-inline inline-block-form" action="{{route('admin-users')}}" method="get">
        <input class="form-control" type="text" name="q" placeholder="Search users" value="{{$query}}">
    </form>
    @if ($query)
        <a href="{{route('admin-users')}}" class="btn btn-info" title="Clear filtering"><i class="fas fa-times"></i></a>
    @endif
    <a @if (request('recent')) href="{{route('admin-users')}}" class="btn btn-info active" @else href="{{route('admin-users')}}?recent=1" class="btn btn-default" @endif title="Show users who joined within the last 7 days">
        Recently joined
        <span class="badge">{{$usersCount}}</span>
    </a>
    <a href="{{route('admin-users-new')}}" class="btn btn-default pull-right" title="Create a new user">New user</a>
</div>
<table class="table table-hover">
    <thead>
        <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Affiliation</th>
            <th>Activity</th>
        </tr>
    </thead>
    <tbody>
        @forelse($users as $u)
            <tr>
                <td>
                    <a href="{{route('admin-users-show', $u->id)}}">{{$u->firstname}} {{$u->lastname}}</a>
                </td>
                <td><a href="mailto:{{$u->email}}">{{$u->email}}</a></td>
                <td>
                    <span class="label label-{{$roleClass[$u->role_id]}}" title="{{$roleNames[$u->role_id]}}">{{$roleNames[$u->role_id][0]}}</span>
                </td>
                <td>
                    @if ($u->affiliation)
                        <span title="{{$u->affiliation}}">{{Str::limit($u->affiliation, 20)}}</span>
                    @else
                        <span class="text-muted">none</span>
                    @endif
                </td>
                <td>
                    @if ($u->login_at)
                        <time datetime="{{$u->login_at->toAtomString()}}" title="{{$u->login_at->toDateTimeString()}}">{{$u->login_at->diffForHumans()}}</time>
                    @else
                        <span class="text-muted">none</span>
                    @endif
                </td>
            </tr>
        @empty
            <tr>
                <td colspan="5" class="text-muted">
                    @if ($query)
                        No users found for query "{{$query}}".
                    @else
                        No users found.
                    @endif
                </td>
            </tr>
        @endforelse
    </tbody>
</table>
<nav class="text-center">
    {{$users->links()}}
</nav>
@endsection
