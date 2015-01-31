<!doctype html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>DIAS - @yield('title')</title>
	{{ HTML::style('assets/styles/dias.min.css') }}
</head>
<body>
	@yield('content')
	{{ HTML::script('assets/scripts/angular.min.js') }}
	{{ HTML::script('assets/scripts/ui-bootstrap-tpls.min.js') }}
	{{ HTML::script('assets/scripts/dias.min.js') }}
</body>
	
</html>
