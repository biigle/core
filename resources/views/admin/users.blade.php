@extends('admin.base')

@section('title')Users admin area @stop

@section('admin-content')
<table class="table">
    <thead>
        <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Last activity</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($users as $user)
            <tr>
                <td>{{$user->name}}</td>
                <td><a href="mailto:{{$user->email}}">{{$user->email}}</a></td>
                <td>{{$user->login_at}}</td>
            </tr>
        @endforeach
    </tbody>
</table>
@endsection
