@extends('app')

@section('title'){{ $transect->name }} @stop

@push('scripts')
    <script src="{{ asset('vendor/transects/scripts/main.js') }}"></script>
    <script src="{{ asset('vendor/ate/scripts/main.js') }}"></script>
    <script type="text/javascript">
        angular.module('dias.ate').constant('TRANSECT_ID', '{{$transect->id}}.ate');
        angular.module('dias.ate').constant('THUMB_DIMENSION', {WIDTH: {{config('thumbnails.width')}}, HEIGHT: {{config('thumbnails.height')}} });
        angular.module('dias.ate').constant('TRANSECT_IMAGES', {!!$annotationIds!!});
        angular.module('dias.ate').constant('LABEL_TREES', {!!$labelTrees!!});
        angular.module('dias.ate').constant('USER_ID', {{$user->id}});

        @can('update', $transect)
            angular.module('dias.ate').constant('IS_ADMIN', true);
        @else
            angular.module('dias.ate').constant('IS_ADMIN', false);
        @endcan
    </script>
@endpush

@push('styles')
    <link href="{{ asset('vendor/transects/styles/main.css') }}" rel="stylesheet">
    <link href="{{ asset('vendor/ate/styles/main.css') }}" rel="stylesheet">
@endpush

@section('navbar')
<div class="navbar-text navbar-ate-breadcrumbs">
    @if ($projects->count() > 1)
        <span class="dropdown">
            <a href="#" class="dropdown-toggle navbar-link">Projects <span class="caret"></span></a>
            <ul class="dropdown-menu">
                @foreach ($projects as $project)
                    <li><a href="{{route('project', $project->id)}}">{{$project->name}}</a></li>
                @endforeach
            </ul>
        </span>
    @else
        <a href="{{route('project', $projects->first()->id)}}" class="navbar-link" title="Show project {{$projects->first()->name}}">{{$projects->first()->name}}</a>
    @endif
    / <strong>{{$transect->name}}</strong> <small>({{ sizeof($annotationIds) }}&nbsp;annotations)</small>
</div>
@endsection

@section('content')
<div class="transect-container" data-ng-app="dias.ate" data-ng-controller="AteController">
    @include('ate::index.images')
    @include('transects::index.progress')
    @include('transects::index.label')
</div>
@endsection
