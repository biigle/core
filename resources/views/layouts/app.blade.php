<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/x-icon" href="{{ cachebust_asset('favicon.ico') }}">
    <title>@yield('title')</title>
    <meta name="description" content="The Bio-Image Indexing and Graphical Labelling Environment is a sophisticated web service for efficient and rapid annotation of still images.">

    <link href="{{ cachebust_asset('assets/styles/main.css') }}" rel="stylesheet">
    @stack('styles')
</head>
<body>
@if($user)
    @include('partials.navbar')
@endif
    @include('partials.messages')
    @yield('content')

    @if (app()->environment('local'))
        <script src="{{ cachebust_asset('assets/scripts/vue.js') }}"></script>
    @else
        <script src="{{ cachebust_asset('assets/scripts/vue.min.js') }}"></script>
    @endif
    <script src="{{ cachebust_asset('assets/scripts/vue-resource.min.js') }}"></script>

    <script type="text/javascript">
        Vue.http.options.root = '{{url('/')}}';
        Vue.http.headers.common['X-CSRF-TOKEN'] = '{{csrf_token()}}';
    </script>

    <script src="{{ cachebust_asset('assets/scripts/angular.min.js') }}"></script>
    <script src="{{ cachebust_asset('assets/scripts/angular-resource.min.js') }}"></script>
    <script src="{{ cachebust_asset('assets/scripts/angular-animate.min.js') }}"></script>
    <script src="{{ cachebust_asset('assets/scripts/ui-bootstrap-tpls.min.js') }}"></script>
    <script src="{{ cachebust_asset('assets/scripts/main.js') }}"></script>
    <script type="text/javascript">
        angular.module('dias.api').constant('URL', '{{ url('/') }}');
    </script>
    @stack('scripts')
</body>
</html>
