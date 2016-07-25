<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    <title>@yield('title')</title>

    <link href="{{ url(elixir('assets/styles/main.css', '')) }}" rel="stylesheet">
    @stack('styles')
</head>
<body>
@if(auth()->check())
    @include('partials.navbar')
@endif
    @include('partials.messages')
    @yield('content')

    <script src="{{ asset('assets/scripts/angular.min.js?v=1.5.7') }}"></script>
    <script src="{{ asset('assets/scripts/angular-resource.min.js?v=1.5.7') }}"></script>
    <script src="{{ asset('assets/scripts/angular-animate.min.js?v=1.5.7') }}"></script>
    <script src="{{ asset('assets/scripts/ui-bootstrap-tpls.min.js?v=1.3.3') }}"></script>
    <script src="{{ url(elixir('assets/scripts/main.js', '')) }}"></script>
    <script type="text/javascript">
        angular.module('dias.api').constant('URL', '{{ url('/') }}');
    </script>
    @stack('scripts')
</body>
</html>
