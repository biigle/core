@extends('app')

@section('title', 'Reset password')
@section('show-navbar', false)

@section('content')
<div class="container">
    <div class="row center-form">
        <div class="col-md-4 col-sm-6">
            <h1 class="logo  logo--standalone"><a href="{{ route('home') }}" class="logo__biigle">BIIGLE</a></h1>
        @if (config('biigle.offline_mode'))
            <div class="alert alert-danger">
                BIIGLE is in offline mode and cannot send password reset emails. Please contact a BIIGLE administrator to reset your password.
            </div>
        @elseif (session('status'))
            <div class="alert alert-success">
                {{ session('status') }}
            </div>
        @else
            <form class="well clearfix" role="form" method="POST" action="{{ url('password/email') }}">
                {{ csrf_field() }}

                <div class="form-group{{ $errors->has('email') ? ' has-error' : '' }}">
                    <div class="input-group">
                        <div class="input-group-addon">
                            <i class="glyphicon glyphicon-user"></i>
                        </div>
                        <input type="email" placeholder="{{ trans('form.email') }}" class="form-control" name="email" value="{{ old('email') }}" autofocus required>
                    </div>
                    @if($errors->has('email'))
                        <span class="help-block">{{ $errors->first('email') }}</span>
                    @else
                        <span class="help-block">{{ trans('auth.send_reset_link') }}</span>
                    @endif
                </div>
                <input type="submit" class="btn btn-warning btn-block" value="{{ trans('form.reset_pw') }}">
            </form>
        @endif
            <p class="clearfix">
                <a href="{{ route('home') }}" class="">{{ trans('biigle.back') }}</a>
            </p>
        </div>
    </div>
</div>
@endsection
