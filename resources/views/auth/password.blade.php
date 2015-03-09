@extends('app')

@section('title')@parent {{ trans('dias.titles.resetpw') }} @endsection

@section('content')
<div class="container">
	<div class="row center-form">
		<div class="col-md-4 col-sm-6">
			<h1 class="logo  logo--standalone"><a href="{{ route('home') }}"><span class="logo__biigle">BIIGLE</span><sup class="logo__dias">DIAS</sup></a></h1>
		@if (session('status'))
			<div class="alert alert-success">
				{{ session('status') }}
			</div>
		@else
			<form class="well clearfix" role="form" method="POST" action="{{ url('password/email') }}">
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
				<input type="hidden" name="_token" value="{{ csrf_token() }}">
				<input type="submit" class="btn btn-warning btn-block" value="{{ trans('form.reset_pw') }}">
			</form>
		@endif
			<p class="clearfix">
				<a href="{{ route('home') }}" class="">{{ trans('dias.back') }}</a>
			</p>
		</div>
	</div>
</div>
@endsection
