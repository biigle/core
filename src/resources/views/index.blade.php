@extends('app')
@inject('modules', 'Dias\Services\Modules')

@section('title'){{ $transect->name }} @stop

@push('scripts')
    <script src="{{ asset('vendor/transects/scripts/main.js') }}"></script>
    <script type="text/javascript">
        angular.module('dias.transects').constant('TRANSECT_IMAGES', {{$imageIds}});
        angular.module('dias.transects').constant('TRANSECT_ID', {{$transect->id}});
        angular.module('dias.transects').constant('THUMB_DIMENSION', {WIDTH: {{config('thumbnails.width')}}, HEIGHT: {{config('thumbnails.height')}} });
        @can('edit-in', $transect)
            angular.module('dias.transects').constant('LABEL_TREES', {!!$labelTrees!!});
        @endcan
    </script>
    @foreach ($modules->getMixins('transectsScripts') as $module => $nestedMixins)
        @include($module.'::transectsScripts', ['mixins' => $nestedMixins])
    @endforeach
@endpush

@push('styles')
    <link href="{{ asset('vendor/transects/styles/main.css') }}" rel="stylesheet">
    @foreach ($modules->getMixins('transectsStyles') as $module => $nestedMixins)
        @include($module.'::transectsStyles', ['mixins' => $nestedMixins])
    @endforeach
@endpush

@section('navbar')
<div class="navbar-text navbar-transects-breadcrumbs">
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
    / <strong>{{$transect->name}}</strong> <small>({{ sizeof($imageIds) }}&nbsp;images)</small>
</div>
@endsection

@section('content')
<div class="transect-container" data-ng-app="dias.transects" data-ng-controller="TransectController">
    @include('transects::index.menubar')
    @include('transects::index.images')
    @include('transects::index.progress')
    @include('transects::index.label')
</div>
@endsection
