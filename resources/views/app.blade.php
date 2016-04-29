<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    <title>@yield('title')</title>

    <link href="{{ asset('assets/styles/main.css') }}" rel="stylesheet">
    @stack('styles')
</head>
<body>
@if(auth()->check())
    @include('partials.navbar')
@endif
    @include('partials.messages')
    @yield('content')

    <script type="text/javascript">
        window.$diasBaseUrl = '{{ url('/') }}';
    </script>
    <script src="{{ asset('assets/scripts/angular.min.js') }}"></script>
    <script src="{{ asset('assets/scripts/angular-resource.min.js') }}"></script>
    <script src="{{ asset('assets/scripts/angular-animate.min.js') }}"></script>
    <script src="{{ asset('assets/scripts/ui-bootstrap-tpls.min.js') }}"></script>
    <script src="{{ asset('assets/scripts/main.js') }}"></script>
    @stack('scripts')
</body>
</html>
