@extends('admin.base')

@section('title')Users admin area @stop

@section('admin-content')
<table class="table">
    <thead>
        <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Last login</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($users as $user)
            <tr>
                <td>{{$user->id}}</td>
                <td>{{$user->name}}</td>
                <td>{{$user->email}}</td>
                <td>{{$user->login_at}}</td>
            </tr>
        @endforeach
    </tbody>
</table>
@endsection
