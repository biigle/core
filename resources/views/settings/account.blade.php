@extends('settings.base')

@section('title', 'Account settings')

@section('settings-content')
<?php $origin = session('origin'); ?>
<div class="form-group">
    <label>Your UUID</label>
    <input class="form-control text-mono" type="text" name="uuid" readonly="true" value="{{$user->uuid}}" style="font-family:Menlo,Monaco,Consolas,'Courier New',monospace;">
    <span class="help-block">The UUID is used to identify your user account across different BIIGLE instances.</span>
</div>
@if ($user->isGlobalAdmin)
    @can('sudo')
        <form method="POST" action="{{ url('api/v1/users/my/settings') }}">
            <input type="hidden" name="super_user_mode" value="0">
            <input type="hidden" name="_method" value="PUT">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <div class="form-group">
                <button type="submit" class="btn btn-danger active" title="Disable Super User Mode to act like a normal user"><i class="fa fa-power-off fa-fw"></i></button> Super User Mode
            </div>
        </form>
    @else
        <form method="POST" action="{{ url('api/v1/users/my/settings') }}">
            <input type="hidden" name="super_user_mode" value="1">
            <input type="hidden" name="_method" value="PUT">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <div class="form-group">
                <button type="submit" class="btn btn-default" title="Enable Super User Mode for your global admin abilities"><i class="fa fa-power-off fa-fw"></i></button> Super User Mode
            </div>
        </form>
    @endcan
@endif
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
            Deleting your account will not delete any of your projects, volumes or annotations etc. They just will not be associated with you any more.
        </p>
        <p class="text-danger">
            <strong>Deleting your account cannot be undone!</strong>
        </p>
        <form role="form" method="POST" action="{{ url('api/v1/users/my') }}" onsubmit="return prompt('Do you really want to delete your account? Please type \'delete\' to continue.').toLowerCase() === 'delete'">
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
                <input type="submit" class="btn btn-danger" id="delete-button" value="Delete my account">
            </div>
        </form>
    </div>
</div>
@endsection
