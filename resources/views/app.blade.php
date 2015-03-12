<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>@section('title')DIAS - @show</title>

	<link href="{{ asset('assets/styles/main.css') }}" rel="stylesheet">

	<!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
	<!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
	<!--[if lt IE 9]>
		<script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
		<script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
	<![endif]-->
</head>
<body>
@if(Auth::check())
	<nav class="navbar navbar-inverse navbar-noradius">
		<div class="container">
			<div class="navbar-header">
				<a class="navbar-brand logo logo-inverse" href="#">
					<span class="logo__biigle">BIIGLE</span><sup class="logo__dias">DIAS</sup>
				</a>
			</div>
			<ul class="nav navbar-nav navbar-right">
				<li class="navbar-text">
					{{ Auth::user()->firstname }} {{ Auth::user()->lastname }}
				</li>
				<li>
					<a href="{{ url('auth/logout') }}" class="btn btn-inverse" title="{{ trans('form.logout') }}"><i class="glyphicon glyphicon-log-out"></i></a>
				</li>
			</ul>
		</div>
	</nav>
@endif
	@yield('content')

	<script src="{{ asset('assets/scripts/angular.min.js') }}"></script>
	<script src="{{ asset('assets/scripts/angular-resource.min.js') }}"></script>
	<script src="{{ asset('assets/scripts/ui-bootstrap-tpls.min.js') }}"></script>
	<script src="{{ asset('assets/scripts/main.js') }}"></script>
</body>
</html>
