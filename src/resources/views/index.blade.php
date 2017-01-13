@extends('app')
@inject('modules', 'Biigle\Services\Modules')

@section('title'){{ $volume->name }} @stop

@push('scripts')
    <script src="{{ cachebust_asset('vendor/volumes/scripts/main.js') }}"></script>
    <script type="text/javascript">
        {{-- Add image IDs as array, too, because the ordering is important! --}}
        angular.module('biigle.volumes').constant('VOLUME_IMAGES', {!!$imageIds->keys()!!});
        angular.module('biigle.volumes').constant('IMAGES_UUIDS', {!!$imageIds!!});
        angular.module('biigle.volumes').constant('VOLUME_ID', {{$volume->id}});
        angular.module('biigle.volumes').constant('THUMB_DIMENSION', {WIDTH: {{config('thumbnails.width')}}, HEIGHT: {{config('thumbnails.height')}} });
        angular.module('biigle.volumes').constant('USER_ID', {{$user->id}});

        @can('update', $volume)
            angular.module('biigle.volumes').constant('IS_ADMIN', true);
        @else
            angular.module('biigle.volumes').constant('IS_ADMIN', false);
        @endcan

        @can('edit-in', $volume)
            angular.module('biigle.volumes').constant('LABEL_TREES', {!!$labelTrees!!});
        @else
            angular.module('biigle.volumes').constant('LABEL_TREES', []);
        @endcan
    </script>
    @foreach ($modules->getMixins('volumesScripts') as $module => $nestedMixins)
        @include($module.'::volumesScripts', ['mixins' => $nestedMixins])
    @endforeach
@endpush

@push('styles')
    <link href="{{ cachebust_asset('vendor/volumes/styles/main.css') }}" rel="stylesheet">
    @foreach ($modules->getMixins('volumesStyles') as $module => $nestedMixins)
        @include($module.'::volumesStyles', ['mixins' => $nestedMixins])
    @endforeach
@endpush

@section('navbar')
<div class="navbar-text navbar-volumes-breadcrumbs">
    @include('volumes::partials.projectsBreadcrumb') / <strong>{{$volume->name}}</strong> <small>({{ $imageIds->count() }}&nbsp;images)</small> @include('volumes::partials.annotationSessionIndicator')
</div>
@endsection

@section('content')
<div class="volume-container" data-ng-app="biigle.volumes" data-ng-controller="VolumeController">
    @include('volumes::index.menubar')
    @include('volumes::index.images')
    @include('volumes::index.progress')
    @can('edit-in', $volume)
        @include('volumes::index.label')
    @endcan
</div>
@endsection
