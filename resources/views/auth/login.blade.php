@extends('app')

@section('title', trans('biigle.titles.login'))

@section('content')
<div class="container">
    <div class="row center-form">
        <div class="col-md-4 col-sm-6">
            <div class="info-text">
                <h1 class="logo logo--standalone"><a href="{{ route('home') }}" class="logo__biigle">BIIGLE</a></h1>
                <p class="text-muted">{{ trans('biigle.info') }} Read <a href="https://doi.org/10.3389/fmars.2017.00083">the paper</a> or take a look at <a href="{{url('manual')}}">the manual</a>.</p>
            </div>
            <form class="well clearfix" role="form" method="POST" action="{{ url('login') }}">
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
                <div class="checkbox">
                    <label>
                        <input type="checkbox" name="remember"> {{ trans('auth.remember_me') }}
                    </label>
                </div>
                <input type="hidden" name="_token" value="{{ csrf_token() }}">
                <input type="submit" class="btn btn-success btn-block" value="{{ trans('form.login') }}">
            </form>
            <p class="clearfix">
                <a href="{{ url('password/reset') }}" class="">{{ trans('auth.forgotpw') }}</a>
                {{--<a href="{{ url('auth/register') }}" class="pull-right">{{ trans('auth.register') }}</a>--}}
            </p>
        </div>
    </div>
</div>
@endsection
