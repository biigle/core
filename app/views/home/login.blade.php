@extends('layouts.master')

@section('content')
<div class="container">
	<div class="row login-form">
		<div class="col-md-4 col-sm-6">
			{{ Form::open(array('action' => 'HomeController@doLogin', 'class' => 'well clearfix')) }}
			<h1 class="logo"><span class="logo__biigle">BIIGLE</span><sup class="logo__dias">DIAS</sup></h1>
			<div class="form-group{{ $errors->has('email') ? ' has-error' : '' }}">
				<div class="input-group">
					<div class="input-group-addon">
						<i class="glyphicon glyphicon-user"></i>
					</div>
					{{ Form::email('email', Input::old('email'), array('placeholder' => Lang::get('form.email'), 'class' => 'form-control', 'required' => '')) }}
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
					{{ Form::password('password', array('class' => 'form-control', 'placeholder' => Lang::get('form.password'), 'required' => '')) }}
				</div>
				@if($errors->has('password'))
					<span class="help-block">{{ $errors->first('password') }}</span>
				@endif
			</div>
			@if($errors->has('auth'))
			<div class="form-group">
				<span class="text-danger">{{ $errors->first('auth') }}</span>
			</div>
			@endif
			<div class="form-group">
				{{ Form::submit(Lang::get('form.login'), array('class' => 'btn btn-success btn-block')) }}
			</div>
		{{ Form::close() }}
		<div data-ng-app="ui.bootstrap">
			<a class="pull-right" href="#" data-ng-click="isShown = !isShown" data-ng-hide="isShown" title="What is DIAS?"><span class="glyphicon glyphicon-info-sign"></span></a>
			<p data-ng-cloak="" data-collapse="!isShown" data-ng-click="isShown = !isShown">{{ Lang::get('dias.info') }}</p>
		</div>
		</div>
	</div>
</div>
@stop