@extends('admin.base')

@section('title', 'Users admin area - Edit user')

@section('admin-content')
<h4>Edit {{$affectedUser->firstname}} {{$affectedUser->lastname}}</h4>
@if (session('saved'))
    <div class="alert alert-success" role="alert">
        The user <strong>{{$affectedUser->firstname}} {{$affectedUser->lastname}}</strong> was successfully updated.
    </div>
@endif
<form class="clearfix" role="form" method="POST" action="{{ url('api/v1/users/'.$affectedUser->id) }}">

    <div class="row">
        <div class="col-sm-6 form-group{{ $errors->has('email') ? ' has-error' : '' }}">
            <label for="email">Email*</label>
            <input type="email" class="form-control" name="email" id="email" value="{{ old('email', $affectedUser->email) }}" required>
            @if($errors->has('email'))
                <span class="help-block">{{ $errors->first('email') }}</span>
            @endif
        </div>

        <div class="col-sm-6 form-group{{ $errors->has('role_id') ? ' has-error' : '' }}">
            <label for="role_id">Role*</label>
            <select class="form-control" name="role_id" id="role_id" required>
                @foreach ($roles as $role)
                    <option value="{{$role->id}}" @selected($affectedUser->role_id === $role->id)>{{ucfirst($role->name)}}</option>
                @endforeach
            </select>
            @if($errors->has('role_id'))
                <span class="help-block">{{ $errors->first('role_id') }}</span>
            @endif
        </div>

    </div>

    <div class="row">

        <div class="col-sm-6 form-group{{ $errors->has('firstname') ? ' has-error' : '' }}">
            <label for="firstname">First name*</label>
            <input type="text" class="form-control" name="firstname" id="firstname" value="{{ old('firstname', $affectedUser->firstname) }}" required>
            @if($errors->has('firstname'))
                <span class="help-block">{{ $errors->first('firstname') }}</span>
            @endif
        </div>

        <div class="col-sm-6 form-group{{ $errors->has('lastname') ? ' has-error' : '' }}">
            <label for="lastname">Last name*</label>
            <input type="text" class="form-control" name="lastname" id="lastname" value="{{ old('lastname', $affectedUser->lastname) }}" required>
            @if($errors->has('lastname'))
                <span class="help-block">{{ $errors->first('lastname') }}</span>
            @endif
        </div>


    </div>

    <div class="row">

        <div class="col-sm-6 form-group{{ $errors->has('affiliation') ? ' has-error' : '' }}">
            <label for="affiliation">Affiliation</label>
            <input type="text" class="form-control" name="affiliation" id="affiliation" value="{{ old('affiliation', $affectedUser->affiliation) }}">
            @if($errors->has('affiliation'))
                <span class="help-block">{{ $errors->first('affiliation') }}</span>
            @endif
        </div>

        <div class="col-sm-6 form-group{{ $errors->has('password') ? ' has-error' : '' }}">
            <label for="password">New password</label>
            <input type="password" class="form-control" name="password" id="password" value="">
            @if($errors->has('password'))
                <span class="help-block">{{ $errors->first('password') }}</span>
            @endif
        </div>

    </div>

    <div class="form-group{{ $errors->has('auth_password') ? ' has-error' : '' }}">
        <label for="auth_password">Your password*</label>
        <input type="password" class="form-control" name="auth_password" id="auth_password" value="" required>
        @if($errors->has('auth_password'))
            <span class="help-block">{{ $errors->first('auth_password') }}</span>
        @endif
        <span class="help-block">Your password is required as additional authentication when changing the email address, password or role of a user.</span>
    </div>

    <input type="hidden" name="_token" value="{{ csrf_token() }}">
    <input type="hidden" name="_method" value="PUT">
    <input type="hidden" name="_redirect" value="{{ route('admin-users-edit', $affectedUser->id) }}">
    <a href="{{ route('admin-users-show', $affectedUser->id) }}" class="btn btn-link">@if(session('saved')) Back @else Cancel @endif</a>
    <span class="pull-right">
        <a href="{{ route('admin-users-delete', $affectedUser->id) }}" class="btn btn-danger" title="Delete {{$affectedUser->firstname}} {{$affectedUser->lastname}}">Delete</a>
        <input type="submit" class="btn btn-success" value="Save" title="Save">
    </span>
</form>
@endsection
