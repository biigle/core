@extends('admin.base')

@section('title')Users admin area - Edit user @stop

@section('admin-content')
<h4>Edit {{$user->firstname}} {{$user->lastname}}</h4>
<form class="clearfix" role="form" method="POST" action="{{ url('api/v1/users/'.$user->id) }}">

    <div class="row">

        <div class="col-sm-6 form-group{{ $errors->has('email') ? ' has-error' : '' }}">
            <label for="email">Email</label>
            <input type="email" class="form-control" name="email" id="email" value="{{ old('email', $user->email) }}" required>
            @if($errors->has('email'))
                <span class="help-block">{{ $errors->first('email') }}</span>
            @endif
        </div>

        <div class="col-sm-6 form-group{{ $errors->has('role_id') ? ' has-error' : '' }}">
            <label for="role_id">Role</label>
            <select class="form-control" name="role_id" id="role_id" required>
                @foreach ($roles as $role)
                    <option value="{{$role->id}}" @if ($user->role_id === $role->id) selected="" @endif>{{ucfirst($role->name)}}</option>
                @endforeach
            </select>
            @if($errors->has('role_id'))
                <span class="help-block">{{ $errors->first('role_id') }}</span>
            @endif
        </div>

    </div>

    <div class="row">

        <div class="col-sm-6 form-group{{ $errors->has('firstname') ? ' has-error' : '' }}">
            <label for="firstname">First name</label>
            <input type="text" class="form-control" name="firstname" id="firstname" value="{{ old('firstname', $user->firstname) }}" required>
            @if($errors->has('firstname'))
                <span class="help-block">{{ $errors->first('firstname') }}</span>
            @endif
        </div>

        <div class="col-sm-6 form-group{{ $errors->has('lastname') ? ' has-error' : '' }}">
            <label for="lastname">Last name</label>
            <input type="text" class="form-control" name="lastname" id="lastname" value="{{ old('lastname', $user->lastname) }}" required>
            @if($errors->has('lastname'))
                <span class="help-block">{{ $errors->first('lastname') }}</span>
            @endif
        </div>

    </div>

    <div class="row">

        <div class="col-sm-6 form-group{{ $errors->has('password') ? ' has-error' : '' }}">
            <label for="password">New password</label>
            <input type="password" class="form-control" name="password" id="password" value="">
            @if($errors->has('password'))
                <span class="help-block">{{ $errors->first('password') }}</span>
            @endif
        </div>

        <div class="col-sm-6 form-group{{ $errors->has('password_confirmation') ? ' has-error' : '' }}">
            <label for="password_confirmation">New password confirmation</label>
            <input type="password" class="form-control" name="password_confirmation" id="password_confirmation" value="">
            @if($errors->has('password_confirmation'))
                <span class="help-block">{{ $errors->first('password_confirmation') }}</span>
            @endif
        </div>

    </div>

    <div class="form-group{{ $errors->has('auth_password') ? ' has-error' : '' }}">
        <label for="auth_password">Your password</label>
        <input type="password" class="form-control" name="auth_password" id="auth_password" value="">
        @if($errors->has('auth_password'))
            <span class="help-block">{{ $errors->first('auth_password') }}</span>
        @endif
        <span class="help-block">Your password is required as additional authentication when changing the email address, password or role of a user.</span>
    </div>

    <input type="hidden" name="_token" value="{{ csrf_token() }}">
    <input type="hidden" name="_method" value="PUT">
    <input type="hidden" name="_redirect" value="{{ route('admin-users') }}">
    <a href="{{ URL::previous() }}" class="btn btn-link">Cancel</a>
    <input type="submit" class="btn btn-success pull-right" value="Save">
    </div>
</form>
@endsection
