@extends('app')

@section('title'){{ trans('dias.titles.login') }}@stop

@push('scripts')
    <script type="text/javascript">
        angular.module('dias.ui.collapse', ['ui.bootstrap.collapse', 'ngAnimate']);
    </script>
@endpush

@section('content')
<div class="container">
    <div class="row center-form">
        <div class="col-md-4 col-sm-6">
            <div data-ng-app="dias.ui.collapse" class="info-text">
                <h1 class="logo  logo--standalone"><a href="{{ route('home') }}"><span class="logo__biigle">BIIGLE</span><sup class="logo__dias">DIAS</sup></a></h1>
                <a class="info-text__sign" href="" data-ng-click="isShown = !isShown" data-ng-hide="isShown" title="What is BIIGLE DIAS?"><span class="glyphicon glyphicon-info-sign"></span></a>
                <p class="ng-cloak" data-uib-collapse="!isShown" data-ng-click="isShown = !isShown">{{ trans('dias.info') }} <a href="{{url('manual')}}">Read more in the manual</a>.</p>
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
