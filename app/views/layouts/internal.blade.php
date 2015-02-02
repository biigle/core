@extends('layouts.master')

@section('content')
<nav class="navbar navbar-inverse navbar-noradius">
	<div class="container-fluid">
		<div class="navbar-header">
			<a class="navbar-brand logo logo-inverse" href="{{action('DashboardController@showDashboard')}}">
				<span class="logo__biigle">BIIGLE</span><sup class="logo__dias">DIAS</sup>
			</a>
		</div>
		<ul class="nav navbar-nav navbar-right">
			<li class="navbar-text">
				{{ $user->firstname }} {{ $user->lastname }}
			</li>
			<li>
				{{ Form::open(array('action' => 'HomeController@doLogout', 'class' => 'navbar-form')) }}
				<div class="form-group">
					{{Form::button('<i class="glyphicon glyphicon-log-out"></i>', array('type' => 'submit', 'class' => 'btn btn-inverse', 'title' => 'Logout'))}}
				</div>
				{{ Form::close() }}
			</li>
		</ul>
	</div>
</nav>
@yield('content-internal')
@stop