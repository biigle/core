@extends('admin.base')

@section('title', 'Recent Users')

@section('admin-content')
@if ($usersCount > 0)
    <div class="alert alert-info" role="alert">
        There are {{$usersCount}} users who joined in the last 7 days.
    </div>
    <table class="table table-hover">
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Affiliation</th>
                <th>Activity</th>
                <th>Created</th>
            </tr>
        </thead>
        <tbody>
            @foreach($users as $u)
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
                    <td>
                        <time datetime="{{$u->created_at->toAtomString()}}" title="{{$u->created_at->toDateTimeString()}}">{{$u->created_at->diffForHumans()}}</time>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
    <nav class="text-center">
        {{$users->links()}}
    </nav>
@else
    <div class="alert alert-info" role="alert">
        No recently joined users found.
    </div>
@endif
@endsection