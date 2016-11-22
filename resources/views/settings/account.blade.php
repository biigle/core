@extends('settings.base')

@section('title')Account settings @stop

@section('settings-content')
<?php $origin = session('origin'); ?>
<div class="panel panel-default">
    <div class="panel-heading">Change password</div>
    <div class="panel-body">
        <form class="" role="form" method="POST" action="{{ url('api/v1/users/my') }}">

            <div class="form-group{{ $errors->has('auth_password') && $origin === 'password'  ? ' has-error' : '' }}">
                <label for="auth_password">Old password</label>
                <input type="password" class="form-control" name="auth_password" id="auth_password" required="required">
                @if($errors->has('auth_password') && $origin === 'password')
                    <span class="help-block">{{ $errors->first('auth_password') }}</span>
                @endif
            </div>

            <div class="form-group{{ $errors->has('password') && $origin === 'password' ? ' has-error' : '' }}">
                <label for="password">New password</label>
                <input type="password" class="form-control" name="password" id="password" required="required">
                @if($errors->has('password') && $origin === 'password')
                    <span class="help-block">{{ $errors->first('password') }}</span>
                @endif
            </div>

            <div class="form-group{{ $errors->has('password_confirmation') ? ' has-error' : '' }}">
                <label for="password_confirmation">Confirm new password</label>
                <input type="password" class="form-control" name="password_confirmation" id="password_confirmation" required="required">
                @if($errors->has('password_confirmation'))
                    <span class="help-block">{{ $errors->first('password_confirmation') }}</span>
                @endif
            </div>

            @if ($saved && $origin === 'password')
                <div class="alert alert-success" role="alert">
                    Your password was successfully updated.
                </div>
            @endif

            <input type="hidden" name="_origin" value="password">
            <input type="hidden" name="_method" value="PUT">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <input type="submit" class="btn btn-success" value="Update password">
        </form>
    </div>
</div>

<div class="panel panel-default">
    <div class="panel-heading">Change email</div>
    <div class="panel-body">
        <form class="" role="form" method="POST" action="{{ url('api/v1/users/my') }}">
            <div class="form-group{{ $errors->has('auth_password') && $origin === 'email' ? ' has-error' : '' }}">
                <label for="auth_password">Password</label>
                <input type="password" class="form-control" name="auth_password" id="auth_password" required="required">
                @if($errors->has('auth_password') && $origin === 'email')
                    <span class="help-block">{{ $errors->first('auth_password') }}</span>
                @endif
            </div>

            <div class="form-group{{ $errors->has('email') ? ' has-error' : '' }}">
                <label for="email">Email</label>
                <input type="email" class="form-control" name="email" id="email" value="{{$user->email}}" required="required">
                @if($errors->has('email'))
                    <span class="help-block">{{ $errors->first('email') }}</span>
                @endif
            </div>

            @if ($saved && $origin === 'email')
                <div class="alert alert-success" role="alert">
                    Your email was successfully updated.
                </div>
            @endif

            <input type="hidden" name="_origin" value="email">
            <input type="hidden" name="_method" value="PUT">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <input type="submit" class="btn btn-success" value="Update email">
        </form>
    </div>
</div>

<div class="panel panel-danger">
    <div class="panel-heading">
        Delete account
    </div>
    <div class="panel-body">
        <p class="text-danger">
            Deleting your account won't delete any of your projects, transects or annotations etc. (they just won't be associated with you any more).<br>
            <strong>Deleting your account cannot be undone!</strong>
        </p>
        <form role="form" method="POST" action="{{ url('api/v1/users/my') }}" onsubmit="return confirm('Do you really want to delete your account?')">
            <input type="hidden" name="_method" value="DELETE">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">

            <div class="form-group{{ $errors->has('password') && $origin === null ? ' has-error' : '' }}">
                <label for="password">Password</label>
                <input type="password" class="form-control" name="password" id="password" required="required">
                @if($errors->has('password') && $origin === null)
                    <span class="help-block">{{ $errors->first('password') }}</span>
                @endif
            </div>

            <div class="form-group{{ $errors->has('submit') ? ' has-error' : '' }}">
                @if($errors->has('submit'))
                    <span class="help-block alert alert-danger">{{ $errors->first('submit') }}</span>
                @endif
                <input type="submit" class="btn btn-danger" id="delete-button" value="Delete your account">
            </div>
        </form>
    </div>
</div>
@endsection
