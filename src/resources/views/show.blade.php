@extends('app')
@inject('modules', 'Biigle\Services\Modules')

@section('title'){{ $volume->name }} @stop

@push('scripts')
    <script src="{{ cachebust_asset('vendor/label-trees/scripts/main.js') }}"></script>
    <script src="{{ cachebust_asset('vendor/volumes/scripts/main.js') }}"></script>
    <script type="text/javascript">
        {{-- Add image IDs as array, too, because the ordering is important! --}}
        {{--
        angular.module('biigle.volumes').constant('VOLUME_IMAGES', {!!$imageIds->keys()!!});
        angular.module('biigle.volumes').constant('IMAGES_UUIDS', {!!$imageIds!!});
        angular.module('biigle.volumes').constant('VOLUME_ID', {{$volume->id}});
        angular.module('biigle.volumes').constant('THUMB_DIMENSION', {WIDTH: {{config('thumbnails.width')}}, HEIGHT: {{config('thumbnails.height')}} });
        angular.module('biigle.volumes').constant('USER_ID', {{$user->id}});
        --}}

        biigle.$declare('volumes.volumeId', {!! $volume->id !!});
        biigle.$declare('volumes.imageIds', {!! $imageIds->keys() !!});
        biigle.$declare('volumes.imageUuids', {!! $imageIds !!});
        biigle.$declare('volumes.thumbUri', '{{ asset(config('thumbnails.uri')) }}/{uuid}.{{ config('thumbnails.format') }}');
        biigle.$declare('volumes.annotateUri', '@if (Route::has('annotate')){{ route('annotate', '') }}/{id}@endif');
        biigle.$declare('volumes.imageUri', '{{ route('image', '') }}/{id}');

    {{--
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
    --}}
    </script>
    {{--
    @foreach ($modules->getMixins('volumesScripts') as $module => $nestedMixins)
        @include($module.'::volumesScripts', ['mixins' => $nestedMixins])
    @endforeach
    --}}
@endpush

@push('styles')
    <link href="{{ cachebust_asset('vendor/label-trees/styles/main.css') }}" rel="stylesheet">
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
<div id="volume-container" class="volume-container">
    <sidebar direction="left" v-on:toggle="handleSidebarToggle" open-tab="filter">
        @can ('update', $volume)
            <sidebar-tab slot="tabs" name="edit" icon="pencil" title="Edit this volume" href="{{ route('volume-edit', $volume->id) }}"></sidebar-tab>
        @endcan
        @can ('edit-in', $volume)
            <sidebar-tab slot="tabs" name="labels" icon="tags" title="Toggle image label mode" :disabled="true"></sidebar-tab>
        @endcan
        <sidebar-tab slot="tabs" name="filter" icon="filter" title="Filter images" :highlight="hasFilterSequence">
            @include('volumes::show.filters')
        </sidebar-tab>
        <sidebar-tab slot="tabs" name="sort" icon="sort" title="Sort images"></sidebar-tab>
    </sidebar>
    <div class="volume-content">
        <loader-block v-cloak :active="loading"></loader-block>
        <image-grid :images="imagesToShow" empty-url="{{ asset(config('thumbnails.empty_url')) }}" :width="{{config('thumbnails.width')}}" :height="{{config('thumbnails.height')}}" ref="imageGrid"></image-grid>

    </div>
</div>
@endsection
