@extends('settings.base')

@section('title')Your Profile @stop

@section('settings-content')
<div class="panel panel-default">
    <div class="panel-heading">Your profile</div>
    <div class="panel-body">
        <form class="" role="form" method="POST" action="{{ url('api/v1/users/my') }}">
            <div class="form-group{{ $errors->has('firstname') ? ' has-error' : '' }}">
                <label for="firstname">Firstname</label>
                <input type="text" class="form-control" name="firstname" id="firstname" value="{{ $user->firstname }}">
                @if($errors->has('firstname'))
                    <span class="help-block">{{ $errors->first('firstname') }}</span>
                @endif
            </div>

            <div class="form-group{{ $errors->has('lastname') ? ' has-error' : '' }}">
                <label for="lastname">Lastname</label>
                <input type="text" class="form-control" name="lastname" id="lastname" value="{{ $user->lastname }}">
                @if($errors->has('lastname'))
                    <span class="help-block">{{ $errors->first('lastname') }}</span>
                @endif
            </div>

            @if ($saved)
                <div class="alert alert-success" role="alert">
                    Your profile was successfully updated.
                </div>
            @endif

            <input type="hidden" name="_redirect-route" value="settings-profile">
            <input type="hidden" name="_method" value="PUT">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <input type="submit" class="btn btn-success" value="Update profile">
        </form>
    </div>
</div>
@endsection
