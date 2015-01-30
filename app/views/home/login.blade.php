@extends('layouts.master')

@section('title')
	Login
@stop

@section('content')
<div class="row login-form">
	<div class="col-md-4">
		{{ Form::open(array('action' => 'HomeController@doLogin')) }}
		<div class="form-group{{ $errors->has('email') ? ' has-error' : '' }}">
			{{ Form::label('email', 'Email Address', array('class' => 'control-label')) }}
			{{ Form::email('email', Input::old('email'), array('placeholder' => 'user@domain.tld', 'class' => 'form-control')) }}
			@if($errors->has('email'))
				<span class="help-block">{{ $errors->first('email') }}</span>
			@endif
		</div>
		<div class="form-group{{ $errors->has('password') ? ' has-error' : '' }}">
			{{ Form::label('password', 'Password', array('class' => 'control-label')) }}
			{{ Form::password('password', array('class' => 'form-control')) }}
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
			{{ Form::submit('Login', array('class' => 'btn btn-default')) }}
		</div>
	{{ Form::close() }}
	</div>
</div>

@stop