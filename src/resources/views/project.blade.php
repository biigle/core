@extends('app')

@section('title'){{ $project->name }} @stop

@push('scripts')
    <script src="{{ cachebust_asset('vendor/transects/scripts/main.js') }}"></script>
    <script src="{{ cachebust_asset('vendor/ate/scripts/main.js') }}"></script>
    <script src="{{ cachebust_asset('vendor/ate/scripts/project-ate.js') }}"></script>
    <script type="text/javascript">
        angular.module('dias.ate').constant('PROJECT_ID', {{$project->id}});
        angular.module('dias.ate').constant('THUMB_DIMENSION', {WIDTH: {{config('thumbnails.width')}}, HEIGHT: {{config('thumbnails.height')}} });
        angular.module('dias.ate').constant('LABEL_TREES', {!!$labelTrees!!});
    </script>
@endpush

@push('styles')
    <link href="{{ cachebust_asset('vendor/transects/styles/main.css') }}" rel="stylesheet">
    <link href="{{ cachebust_asset('vendor/ate/styles/main.css') }}" rel="stylesheet">
@endpush

@section('navbar')
<div class="navbar-text navbar-ate-breadcrumbs">
    <a href="{{route('project', $project->id)}}" class="navbar-link" title="Show project {{$project->name}}">{{$project->name}}</a>
    / <strong id="dismiss-mode-title">ATE - dismiss existing annotations</strong><strong id="re-labelling-mode-title" class="ng-hide">ATE - re-label dismissed annotations</strong> <small>(<span id="annotation-count">0</span>&nbsp;annotations)</small>
</div>
@endsection

@section('content')
<div class="transect-container" data-ng-app="dias.project-ate" data-ng-controller="AteController" data-ng-class="getClass()">
    @include('ate::index.images')
    @include('transects::index.progress')
    @include('ate::index.label')
</div>
@endsection
