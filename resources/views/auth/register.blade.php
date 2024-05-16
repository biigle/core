@extends('app')

@section('title', 'Sign up')
@section('show-navbar', false)

@section('content')
<div class="container" id="register-form">
    <div class="row center-form">
        <div class="col-md-4 col-sm-6">
            <h1 class="logo  logo--standalone">
                <a href="{{ route('home') }}" class="logo__biigle">BIIGLE</a>
            </h1>
            <form class="well clearfix" role="form" method="POST" action="{{ url('register') }}">

                <p class="lead text-center">
                    {{ trans('biigle.new_acc') }}
                </p>

                @if (config('biigle.sso_registration_only'))
                    <div class="panel panel-warning">
                        <div class="panel-body text-warning">
                            {{config('biigle.sso_registration_only_message')}}
                        </div>
                    </div>
                    @mixin('registerButton')
                @else
                    @unless (empty(app('modules')->getViewMixins('registerButton')))
                        <p class="text-center">
                            Use your institutional email address via single sign-on (recommended).
                        </p>
                        @mixin('registerButton')
                        <hr>
                        <p class="text-center">
                            Or use your <a href="#" title="Sign up with your personal email address" v-on:click.prevent="showForm">personal email address</a>.
                        </p>
                    @endunless

                    <div ref="ht"></div>

                    <div @unless ($errors->any() || empty(app('modules')->getViewMixins('registerButton'))) v-if="form" v-cloak @endunless>

                        <div class="form-group{{ $errors->has('email') ? ' has-error' : '' }}">
                            <div class="input-group">
                                <div class="input-group-addon">
                                    <i class="fa fa-envelope"></i>
                                </div>
                                <input type="email" placeholder="{{ trans('form.email') }}" class="form-control" name="email" value="{{ old('email') }}" autofocus required>
                            </div>
                            @if($errors->has('email'))
                                <span class="help-block">{{ $errors->first('email') }}</span>
                            @endif
                        </div>

                        <div class="form-group{{ $errors->has('firstname') ? ' has-error' : '' }}">
                            <div class="input-group">
                                <div class="input-group-addon">
                                    <i class="fa fa-user"></i>
                                </div>
                                <input type="text" placeholder="{{ trans('form.firstname') }}" class="form-control" name="firstname" value="{{ old('firstname') }}" required>
                            </div>
                            @if($errors->has('firstname'))
                                <span class="help-block">{{ $errors->first('firstname') }}</span>
                            @endif
                        </div>

                        <div class="form-group{{ $errors->has('lastname') ? ' has-error' : '' }}">
                            <div class="input-group">
                                <div class="input-group-addon">
                                    <i class="fa fa-user"></i>
                                </div>
                                <input type="text" placeholder="{{ trans('form.lastname') }}" class="form-control" name="lastname" value="{{ old('lastname') }}" required>
                            </div>
                            @if($errors->has('lastname'))
                                <span class="help-block">{{ $errors->first('lastname') }}</span>
                            @endif
                        </div>

                        <div class="form-group{{ $errors->has('affiliation') ? ' has-error' : '' }}">
                            <div class="input-group">
                                <div class="input-group-addon">
                                    <i class="fa fa-building"></i>
                                </div>
                                <input type="text" placeholder="Affiliation (institute name, company, etc.)" class="form-control" name="affiliation" value="{{ old('affiliation') }}">
                            </div>
                            @if($errors->has('affiliation'))
                                <span class="help-block">{{ $errors->first('affiliation') }}</span>
                            @endif
                        </div>

                        <div class="form-group{{ $errors->has('password') ? ' has-error' : '' }}">
                            <div class="input-group">
                                <div class="input-group-addon">
                                    <i class="fa fa-lock"></i>
                                </div>
                                <input type="password" minlength="8" placeholder="{{ trans('form.password') }}" class="form-control" name="password" required>
                            </div>
                            @if($errors->has('password'))
                                <span class="help-block">{{ $errors->first('password') }}</span>
                            @endif
                        </div>

                        @mixin('registrationForm')

                        @include('auth.partials.privacy-checkbox')
                        @include('auth.partials.terms-checkbox')

                        @if ($errors->has('homepage'))
                            <p class="text-danger">{{ $errors->first('homepage') }}</p>
                        @endif
                        @if ($errors->has('website'))
                            <p class="text-danger">{{ $errors->first('website') }}</p>
                        @endif

                        <input type="hidden" name="_token" :value="token">
                        <input type="submit" class="btn btn-success btn-block" value="Sign up" onclick="this.disabled=true;this.form.submit();">
                    </div>
                @endif
            </form>
            <div ref="hs">
                {!! Honeypot::generate('website', 'homepage') !!}
            </div>
            <p class="clearfix">
                <a href="{{ route('home') }}" class="">{{ trans('biigle.back') }}</a>
                <a href="{{ url('login') }}" class="pull-right" title="Log in">Log in</a>
            </p>
        </div>
    </div>
</div>
@include('partials.footer', [
    'positionAbsolute' => true,
])
@endsection
