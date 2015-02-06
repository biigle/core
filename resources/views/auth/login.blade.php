@extends('app')

@section('title')@parent Login @endsection

@section('content')
<div class="container">
	<div class="row login-form">
		<div class="col-md-4 col-sm-6">
			<h1 class="logo"><span class="logo__biigle">BIIGLE</span><sup class="logo__dias">DIAS</sup></h1>
			<form class="well clearfix" role="form" method="POST" action="/auth/login">
				<div class="form-group{{ $errors->has('email') ? ' has-error' : '' }}">
					<div class="input-group">
						<div class="input-group-addon">
							<i class="glyphicon glyphicon-user"></i>
						</div>
						<input type="email" placeholder="{{ trans('form.email') }}" class="form-control" name="email" value="{{ old('email') }}" required>
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
				<input type="hidden" name="_token" value="{{ csrf_token() }}">
				<input type="submit" class="btn btn-success btn-block" value="{{ trans('form.login') }}">
			</form>
			<p class="clearfix">
				<a href="#" class="">{{ trans('auth.forgotpw') }}</a>
				<a href="/auth/register" class="pull-right">{{ trans('auth.register') }}</a>
			</p>
			<div data-ng-app="ui.bootstrap">
				<a class="pull-right" href="#" data-ng-click="isShown = !isShown" data-ng-hide="isShown" title="What is DIAS?"><span class="glyphicon glyphicon-info-sign"></span></a>
				<p data-ng-cloak="" data-collapse="!isShown" data-ng-click="isShown = !isShown">{{ trans('dias.info') }}</p>
			</div>
		</div>
	</div>
</div>
@endsection
