@extends('app')

@section('title')@parent Register @endsection

@section('content')
<div class="container">
	<div class="row login-form">
		<div class="col-md-4 col-sm-6">
			<h1 class="logo"><span class="logo__biigle">BIIGLE</span><sup class="logo__dias">DIAS</sup></h1>
			<form class="well clearfix" role="form" method="POST" action="/auth/register">
				<p class="lead text-center">{{ trans('dias.newacc') }}</p>
				<div class="form-group{{ $errors->has('email') ? ' has-error' : '' }}">
					<div class="input-group">
						<div class="input-group-addon">
							<i class="glyphicon glyphicon-envelope"></i>
						</div>
						<input type="email" placeholder="{{ trans('form.email') }}" class="form-control" name="email" value="{{ old('email') }}" required>
					</div>
					@if($errors->has('email'))
						<span class="help-block">{{ $errors->first('email') }}</span>
					@endif
				</div>

				<div class="form-group{{ $errors->has('firstname') ? ' has-error' : '' }}">
					<div class="input-group">
						<div class="input-group-addon">
							<i class="glyphicon glyphicon-user"></i>
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
							<i class="glyphicon glyphicon-user"></i>
						</div>
						<input type="text" placeholder="{{ trans('form.lastname') }}" class="form-control" name="lastname" value="{{ old('lastname') }}" required>
					</div>
					@if($errors->has('lastname'))
						<span class="help-block">{{ $errors->first('lastname') }}</span>
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

				<div class="form-group{{ $errors->has('password_confirmation') ? ' has-error' : '' }}">
					<div class="input-group">
						<div class="input-group-addon">
							<i class="glyphicon glyphicon-lock"></i>
						</div>
						<input type="password" placeholder="{{ trans('form.password_confirmation') }}" class="form-control" name="password_confirmation" value="{{ old('password_confirmation') }}" required>
					</div>
					@if($errors->has('password_confirmation'))
						<span class="help-block">{{ $errors->first('password_confirmation') }}</span>
					@endif
				</div>

				<input type="hidden" name="_token" value="{{ csrf_token() }}">
				<input type="submit" class="btn btn-success btn-block" value="{{ trans('form.register') }}">
			</form>
		</div>
	</div>
</div>
@endsection
