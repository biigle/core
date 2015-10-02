<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    <title>@yield('title')</title>

    <link href="{{ asset('assets/styles/main.css') }}" rel="stylesheet">
    @yield('styles')

    <!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
    <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
    <!--[if lt IE 9]>
        <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
        <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
</head>
<body>
@if(auth()->check())
    @include('partials.navbar')
@endif
    @include('partials.messages')
    @yield('content')

    <script type="text/javascript">
        window.$diasBaseUrl = '{{ url() }}';
    </script>
    <script src="{{ asset('assets/scripts/angular.min.js') }}"></script>
    <script src="{{ asset('assets/scripts/angular-resource.min.js') }}"></script>
    <script src="{{ asset('assets/scripts/ui-bootstrap-tpls.min.js') }}"></script>
    <script src="{{ asset('assets/scripts/main.js') }}"></script>
    @yield('scripts')
</body>
</html>
