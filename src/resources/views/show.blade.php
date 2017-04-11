@extends('app')
@inject('modules', 'Biigle\Services\Modules')

@section('title'){{ $volume->name }} @stop

@push('scripts')
    <script src="{{ cachebust_asset('vendor/label-trees/scripts/main.js') }}"></script>
    <script src="{{ cachebust_asset('vendor/volumes/scripts/main.js') }}"></script>
    <script type="text/javascript">
        biigle.$declare('volumes.volumeId', {!! $volume->id !!});
        {{-- Add image IDs as array, too, because the ordering is important! --}}
        biigle.$declare('volumes.imageIds', {!! $imageIds->keys() !!});
        biigle.$declare('volumes.imageUuids', {!! $imageIds !!});
        biigle.$declare('volumes.thumbUri', '{{ asset(config('thumbnails.uri')) }}/{uuid}.{{ config('thumbnails.format') }}');
        biigle.$declare('volumes.annotateUri', '@if (Route::has('annotate')){{ route('annotate', '') }}/{id}@endif');
        biigle.$declare('volumes.imageUri', '{{ route('image', '') }}/{id}');

        biigle.$declare('volumes.userId', {!! $user->id !!});
        biigle.$declare('volumes.isAdmin', @can('update', $volume) true @else false @endcan);

        @can('edit-in', $volume)
            biigle.$declare('volumes.labelTrees', {!!$labelTrees!!});
        @endcan
    </script>
    @foreach ($modules->getMixins('volumesScripts') as $module => $nestedMixins)
        @include($module.'::volumesScripts', ['mixins' => $nestedMixins])
    @endforeach
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
    <sidebar direction="left" v-on:toggle="handleSidebarToggle" v-on:open="handleSidebarOpen" v-on:close="handleSidebarClose">
        @can ('update', $volume)
            <sidebar-tab slot="tabs" name="edit" icon="pencil" title="Edit this volume" href="{{ route('volume-edit', $volume->id) }}"></sidebar-tab>
        @endcan
        @can ('edit-in', $volume)
            <sidebar-tab slot="tabs" name="labels" icon="tags" title="Toggle image label mode">
                @include('volumes::show.labels')
            </sidebar-tab>
        @endcan
        <sidebar-tab slot="tabs" name="filter" icon="filter" title="Filter images" :highlight="hasFilterSequence">
            @include('volumes::show.filters')
        </sidebar-tab>
        <sidebar-tab slot="tabs" name="sort" icon="sort" title="Sort images" :disabled="true"></sidebar-tab>
        @foreach ($modules->getMixins('volumesSidebar') as $module => $nestedMixins)
            @include($module.'::volumesSidebar')
        @endforeach
    </sidebar>
    <div class="volume-content">
        <loader-block v-cloak :active="loading"></loader-block>
        <image-grid :label-mode="imageLabelMode" :images="imagesToShow" :initial-offset="initialOffset" :selected-label="selectedLabel" empty-url="{{ asset(config('thumbnails.empty_url')) }}" :width="{{config('thumbnails.width')}}" :height="{{config('thumbnails.height')}}" v-on:scroll="handleImageGridScroll" ref="imageGrid"></image-grid>
    </div>
</div>
@endsection
