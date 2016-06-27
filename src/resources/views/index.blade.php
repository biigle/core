@extends('app')

@section('title'){{ $transect->name }} @stop

@push('scripts')
    <script src="{{ asset('vendor/transects/scripts/main.js') }}"></script>
    <script src="{{ asset('vendor/ate/scripts/main.js') }}"></script>
    <script type="text/javascript">
        {{-- Fake TRANSECT_ID so the images service of dias.transects can be reused --}}
        angular.module('dias.ate').constant('TRANSECT_ID', '{{$transect->id}}.ate');
        angular.module('dias.ate').constant('ATE_TRANSECT_ID', {{$transect->id}});
        angular.module('dias.ate').constant('THUMB_DIMENSION', {WIDTH: {{config('thumbnails.width')}}, HEIGHT: {{config('thumbnails.height')}} });
        angular.module('dias.ate').constant('TRANSECT_IMAGES', []);
        angular.module('dias.ate').constant('LABEL_TREES', {!!$labelTrees!!});
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
    / <a href="{{route('transect', $transect->id)}}" title="Show transect {{$transect->name}}">{{$transect->name}}</a>
    / <strong id="dismiss-mode-title">ATE - dismiss existing annotations</strong><strong id="re-labelling-mode-title" class="ng-hide">ATE - re-label dismissed annotations</strong> <small>(<span id="annotation-count">0</span>&nbsp;annotations)</small>
</div>
@endsection

@section('content')
<div class="transect-container" data-ng-app="dias.ate" data-ng-controller="AteController" data-ng-class="getClass()">
    @include('ate::index.images')
    @include('transects::index.progress')
    @include('ate::index.label')
</div>
@endsection
