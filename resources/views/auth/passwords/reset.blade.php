@extends('app')

@section('title', trans('biigle.titles.resetpw'))
@section('show-navbar', false)

@section('content')
<div class="container">
    <div class="row center-form">
        <div class="col-md-4 col-sm-6">
            <h1 class="logo  logo--standalone"><a href="{{ route('home') }}" class="logo__biigle">BIIGLE</a></h1>
            <form class="well clearfix" role="form" method="POST" action="{{ url('password/reset') }}">
                {{ csrf_field() }}
                <p class="lead text-center">{{ trans('auth.reset_pw') }}</p>
                <div class="form-group{{ $errors->has('email') ? ' has-error' : '' }}">
                    <div class="input-group">
                        <div class="input-group-addon">
                            <i class="glyphicon glyphicon-user"></i>
                        </div>
                        <input type="email" placeholder="{{ trans('form.email') }}" class="form-control" name="email" value="{{ old('email') }}" autofocus required>
                    </div>
                    @if($errors->has('email'))
                        <span class="help-block">{{ $errors->first('email') }}</span>
                    @endif
                </div>

                <div class="form-group{{ $errors->has('password') ? ' has-error' : '' }}">
                    <div class="input-group">
                        <div class="input-group-addon">
                            <i class="glyphicon glyphicon-lock"></i>
                        </div>
                        <input type="password" placeholder="{{ trans('form.password') }}" class="form-control" name="password" value="{{ old('password') }}" required>
                    </div>
                    @if($errors->has('password'))
                        <span class="help-block">{{ $errors->first('password') }}</span>
                    @endif
                </div>

                <div class="form-group">
                    <div class="input-group">
                        <div class="input-group-addon">
                            <i class="glyphicon glyphicon-lock"></i>
                        </div>
                        <input type="password" placeholder="{{ trans('form.password_confirmation') }}" class="form-control" name="password_confirmation" value="{{ old('password_confirmation') }}" required>
                    </div>
                    <span class="help-block">{{ trans('auth.reset_pw_help') }}</span>
                </div>

                <input type="hidden" name="token" value="{{ $token }}">
                <input type="submit" class="btn btn-warning btn-block" value="{{ trans('auth.reset_pw') }}">
            </form>
        </div>
    </div>
</div>
@endsection
