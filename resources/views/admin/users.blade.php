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
            <th>Role</th>
            <th>Affiliation</th>
            <th>Activity</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($users as $u)
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
                        <span title="{{$u->affiliation}}">{{str_limit($u->affiliation, 20)}}</span>
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
        @endforeach
    </tbody>
</table>
@endsection
