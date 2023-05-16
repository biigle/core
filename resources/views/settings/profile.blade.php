@extends('settings.base')

@section('title', 'Your Profile')

@section('settings-content')
<h2>Profile</h2>
<p>
    This is the information that is visible to other users.
</p>
<div class="panel panel-default">
    <div class="panel-body">
        <form class="" role="form" method="POST" action="{{ url('api/v1/users/my') }}">
            <div class="form-group{{ $errors->has('firstname') ? ' has-error' : '' }}">
                <label for="firstname">First name</label>
                <input type="text" class="form-control" name="firstname" id="firstname" value="{{ $user->firstname }}" required>
                @if($errors->has('firstname'))
                    <span class="help-block">{{ $errors->first('firstname') }}</span>
                @endif
            </div>

            <div class="form-group{{ $errors->has('lastname') ? ' has-error' : '' }}">
                <label for="lastname">Last name</label>
                <input type="text" class="form-control" name="lastname" id="lastname" value="{{ $user->lastname }}" required>
                @if($errors->has('lastname'))
                    <span class="help-block">{{ $errors->first('lastname') }}</span>
                @endif
            </div>

            <div class="form-group{{ $errors->has('affiliation') ? ' has-error' : '' }}">
                <label for="affiliation">Affiliation</label>
                <input type="text" class="form-control" name="affiliation" id="affiliation" value="{{ $user->affiliation }}">
                @if($errors->has('affiliation'))
                    <span class="help-block">{{ $errors->first('affiliation') }}</span>
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
