@extends('layouts.master')

@section('title')
	Dashboard
@stop

@section('content')
<div class="row">
	<div class="col-md-4 col-md-offset-4">
		Hello {{ $user->firstname }}. @{{angular braces}}
		{{ Form::open(array('action' => 'HomeController@doLogout')) }}
			<div class="form-group">
				{{ Form::submit('Logout', array('class' => 'btn btn-default')) }}
			</div>
		{{ Form::close() }}
	</div>
</div>
@stop