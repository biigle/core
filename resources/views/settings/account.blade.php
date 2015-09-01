@extends('settings.base')

@section('title')Account settings @stop

@section('settings-content')
<div class="panel panel-default">
    <div class="panel-heading">Change password</div>
    <div class="panel-body">
        <form class="" role="form" method="POST" action="{{ url('api/v1/users/my') }}">

            <div class="form-group{{ $errors->has('old_password') ? ' has-error' : '' }}">
                <label for="old_password">Old password</label>
                <input type="password" class="form-control" name="old_password" id="old_password">
                @if($errors->has('old_password'))
                    <span class="help-block">{{ $errors->first('old_password') }}</span>
                @endif
            </div>

            <div class="form-group{{ $errors->has('password') ? ' has-error' : '' }}">
                <label for="password">New password</label>
                <input type="password" class="form-control" name="password" id="password">
                @if($errors->has('password'))
                    <span class="help-block">{{ $errors->first('password') }}</span>
                @endif
            </div>

            <div class="form-group{{ $errors->has('password_confirmation') ? ' has-error' : '' }}">
                <label for="password_confirmation">Confirm new password</label>
                <input type="password" class="form-control" name="password_confirmation" id="password_confirmation">
                @if($errors->has('password_confirmation'))
                    <span class="help-block">{{ $errors->first('password_confirmation') }}</span>
                @endif
            </div>

            @if ($saved)
                <div class="alert alert-success" role="alert">
                    Your password was successfully updated.
                </div>
            @endif

            <input type="hidden" name="_redirect-route" value="settings-account">
            <input type="hidden" name="_method" value="PUT">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <input type="submit" class="btn btn-success" value="Update password"> <a href="{{ url('password/email') }}">{{ trans('auth.forgotpw') }}</a>
        </form>
    </div>
</div>

<div class="panel panel-default">
    <div class="panel-heading">Change username</div>
    <div class="panel-body">
        <form class="" role="form">
            <div class="form-group">
                <input type="text" class="form-control" id="username" value="{{ $user->name }}" disabled>
                <span class="help-block">Your username currently cannot be changed.</span>
            </div>
        </form>
    </div>
</div>

<div class="panel panel-danger">
    <div class="panel-heading">
        Delete account
        <button class="btn btn-xs btn-default pull-right" title="Unlock delete button" onclick="document.getElementById('delete-button').classList.remove('disabled')">Unlock</button>
    </div>
    <div class="panel-body">
        <p class="text-danger">
            Deleting your account will delete all your jobs and pipelines.<br>
            <strong>This cannot be undone!</strong>
        </p>
        <form role="form" method="POST" action="{{ url('api/v1/users/my') }}">
            <input type="hidden" name="_method" value="DELETE">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <input type="submit" class="btn btn-danger disabled" id="delete-button" value="Delete your account">
        </form>
    </div>
</div>
@endsection
