@extends('app')

@section('title', 'Login')
@section('show-navbar', false)

@section('content')
<div class="container">
    <div class="row center-form">
        <div class="col-md-4 col-sm-6">
            <div class="info-text">
                <h1 class="logo logo--standalone"><a href="{{ route('home') }}" class="logo__biigle">BIIGLE</a></h1>
                @unless(view()->exists('landing'))
                    <p class="text-muted">
                        The Bio-Image Indexing and Graphical Labelling Environment is a web service for the efficient and rapid annotation of still images. Read <a href="https://doi.org/10.3389/fmars.2017.00083">the paper</a> or take a look at <a href="{{url('manual')}}">the manual</a>.
                    </p>
                @endunless
            </div>
            <form class="well clearfix" role="form" method="POST" action="{{ url('login') }}">
                <div class="form-group{{ $errors->has('email') ? ' has-error' : '' }}">
                    <div class="input-group">
                        <div class="input-group-addon">
                            <i class="fa fa-user"></i>
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
                            <i class="fa fa-lock"></i>
                        </div>
                        <input type="password" placeholder="{{ trans('form.password') }}" class="form-control" name="password" value="{{ old('password') }}" required>
                    </div>
                    @if($errors->has('password'))
                        <span class="help-block">{{ $errors->first('password') }}</span>
                    @endif
                </div>
                <input type="hidden" name="_token" value="{{ csrf_token() }}">
                <input type="submit" class="btn btn-success btn-block" value="Log in">
            </form>
            <p class="clearfix">
                <a href="{{ url('password/reset') }}" class="">{{ trans('auth.forgotpw') }}</a>
                @if (config('biigle.user_registration'))
                    <a href="{{ url('register') }}" class="pull-right" title="Create a new BIIGLE account">Sign up</a>
                @endif
            </p>
        </div>
    </div>
</div>
@include('partials.footer', ['positionAbsolute' => true])
@endsection
