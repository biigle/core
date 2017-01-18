@extends('app')

@section('title'){{ $project->name }} @stop

@push('scripts')
    <script src="{{ cachebust_asset('vendor/volumes/scripts/main.js') }}"></script>
    <script src="{{ cachebust_asset('vendor/largo/scripts/main.js') }}"></script>
    <script src="{{ cachebust_asset('vendor/largo/scripts/project-largo.js') }}"></script>
    <script type="text/javascript">
        angular.module('biigle.largo').constant('PROJECT_ID', {{$project->id}});
        angular.module('biigle.largo').constant('THUMB_DIMENSION', {WIDTH: {{config('thumbnails.width')}}, HEIGHT: {{config('thumbnails.height')}} });
        angular.module('biigle.largo').constant('LABEL_TREES', {!!$labelTrees!!});
    </script>
@endpush

@push('styles')
    <link href="{{ cachebust_asset('vendor/volumes/styles/main.css') }}" rel="stylesheet">
    <link href="{{ cachebust_asset('vendor/largo/styles/main.css') }}" rel="stylesheet">
@endpush

@section('navbar')
<div class="navbar-text navbar-largo-breadcrumbs">
    <a href="{{route('project', $project->id)}}" class="navbar-link" title="Show project {{$project->name}}">{{$project->name}}</a>
    / <strong id="dismiss-mode-title">Largo - dismiss existing annotations</strong><strong id="re-labelling-mode-title" class="ng-hide">Largo - re-label dismissed annotations</strong> <small>(<span id="annotation-count">0</span>&nbsp;annotations)</small>
</div>
@endsection

@section('content')
<div class="volume-container" data-ng-app="biigle.project-largo" data-ng-controller="LargoController" data-ng-class="getClass()">
    @include('largo::index.images')
    @include('volumes::index.progress')
    @include('largo::index.label')
</div>
@endsection
