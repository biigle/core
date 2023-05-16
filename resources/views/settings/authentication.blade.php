@extends('settings.base')

@section('title', 'Account settings')

@section('settings-content')
<h2>Authentication</h2>
<p>
    Here you can configure the way how you can sign in to your account.
</p>
<div class="panel panel-default">
    <div class="panel-heading">Change password</div>
    <div class="panel-body">
        <form class="" role="form" method="POST" action="{{ url('api/v1/users/my') }}">

            <div class="form-group{{ $errors->has('auth_password')  ? ' has-error' : '' }}">
                <label for="auth_password">Old password</label>
                <input type="password" class="form-control" name="auth_password" id="auth_password" required="required">
                @if($errors->has('auth_password'))
                    <span class="help-block">{{ $errors->first('auth_password') }}</span>
                @endif
            </div>

            <div class="form-group{{ $errors->has('password') ? ' has-error' : '' }}">
                <label for="password">New password</label>
                <input type="password" class="form-control" name="password" id="password" required="required">
                @if($errors->has('password'))
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

            @if ($saved)
                <div class="alert alert-success" role="alert">
                    Your password was successfully updated.
                </div>
            @endif

            <input type="hidden" name="_method" value="PUT">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <input type="submit" class="btn btn-success" value="Update password">
        </form>
    </div>
</div>

@if (!empty(app('modules')->getViewMixins('settingsThirdPartyAuthentication')))
<div class="panel panel-default">
    <div class="panel-heading">Third party authentication</div>
    <ul class="list-group">
        @mixin('settingsThirdPartyAuthentication')
    </ul>
</div>
@endif
@endsection
