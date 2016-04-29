@extends('admin.base')

@section('title')Users admin area - New user @stop

@section('admin-content')
<h4>Create a new user</h4>
<form class="clearfix" role="form" method="POST" action="{{ url('api/v1/users') }}">

    <div class="form-group{{ $errors->has('email') ? ' has-error' : '' }}">
        <label for="email">Email</label>
        <input type="email" class="form-control" name="email" id="email" value="{{ old('email') }}" required>
        @if($errors->has('email'))
            <span class="help-block">{{ $errors->first('email') }}</span>
        @endif
    </div>

    <div class="row">

        <div class="col-sm-6 form-group{{ $errors->has('firstname') ? ' has-error' : '' }}">
            <label for="firstname">First name</label>
            <input type="text" class="form-control" name="firstname" id="firstname" value="{{ old('firstname') }}" required>
            @if($errors->has('firstname'))
                <span class="help-block">{{ $errors->first('firstname') }}</span>
            @endif
        </div>

        <div class="col-sm-6 form-group{{ $errors->has('lastname') ? ' has-error' : '' }}">
            <label for="lastname">Last name</label>
            <input type="text" class="form-control" name="lastname" id="lastname" value="{{ old('lastname') }}" required>
            @if($errors->has('lastname'))
                <span class="help-block">{{ $errors->first('lastname') }}</span>
            @endif
        </div>

    </div>

    <div class="row">

        <div class="col-sm-6 form-group{{ $errors->has('password') ? ' has-error' : '' }}">
            <label for="password">Password</label>
            <input type="password" class="form-control" name="password" id="password" value="" required>
            @if($errors->has('password'))
                <span class="help-block">{{ $errors->first('password') }}</span>
            @endif
        </div>

        <div class="col-sm-6 form-group{{ $errors->has('password_confirmation') ? ' has-error' : '' }}">
            <label for="password_confirmation">Password confirmation</label>
            <input type="password" class="form-control" name="password_confirmation" id="password_confirmation" value="" required>
            @if($errors->has('password_confirmation'))
                <span class="help-block">{{ $errors->first('password_confirmation') }}</span>
            @endif
        </div>

    </div>

    <input type="hidden" name="_token" value="{{ csrf_token() }}">
    <input type="hidden" name="_redirect" value="{{ route('admin-users') }}">
    <a href="{{ URL::previous() }}" class="btn btn-link">Cancel</a>
    <input type="submit" class="btn btn-success pull-right" value="Create">
    </div>
</form>
@endsection
