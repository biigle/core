@extends('app')
@section('full-navbar', true)
@section('title', $volume->name)

@push('scripts')
    <script type="module">
        biigle.$declare('volumes.volumeId', {!! $volume->id !!});
        biigle.$declare('volumes.type', '{!! $type !!}');
        {{-- Add file IDs as array, too, because the ordering is important! --}}
        biigle.$declare('volumes.fileIds', {!! $fileIds->keys() !!});
        biigle.$declare('volumes.fileUuids', {!! $fileIds !!});
        biigle.$declare('volumes.thumbUri', '{{ $thumbUriTemplate }}');
        @if ($volume->isImageVolume())
            biigle.$declare('volumes.thumbCount', 1);
            biigle.$declare('volumes.annotateUri', '{{ route('annotate', ':id') }}');
            biigle.$declare('volumes.infoUri', '{{ route('image', ':id') }}');
        @else
            biigle.$declare('volumes.thumbCount', {{ config('videos.thumbnail_count') }});
            biigle.$declare('volumes.annotateUri', '{{ route('video-annotate', ':id') }}');
            biigle.$declare('volumes.infoUri', '{{ route('video', ':id') }}');
        @endif

        biigle.$declare('volumes.userId', {!! $user->id !!});
        biigle.$declare('volumes.isAdmin', @can('update', $volume) true @else false @endcan);

        @can('edit-in', $volume)
            biigle.$declare('volumes.labelTrees', {!!$labelTrees!!});
        @endcan
    </script>
    @mixin('volumesScripts')
@endpush

@push('styles')
    @mixin('volumesStyles')
@endpush

@section('navbar')
<div class="navbar-text navbar-volumes-breadcrumbs">
    @include('volumes.partials.projectsBreadcrumb') / <strong>{{$volume->name}}</strong> <small id="volume-file-count">(<span v-text="text" v-cloak></span><span v-if="false">{{ $fileIds->count() }}</span>&nbsp;{{$type}}s)</small> @include('volumes.partials.annotationSessionIndicator') @include('volumes.partials.handleIndicator') @include('volumes.partials.metadataIndicator')
</div>
@endsection

@section('content')
<div id="volume-container" class="sidebar-container">
    <sidebar ref="sidebar" direction="left" v-on:open="handleSidebarOpen" v-on:close="handleSidebarClose">
        @can ('update', $volume)
            <sidebar-tab name="edit" icon="pencil-alt" title="Edit this volume" href="{{ route('volume-edit', $volume->id) }}"></sidebar-tab>
        @endcan
        @can ('edit-in', $volume)
            <sidebar-tab name="labels" icon="tags" title="Toggle {{$type}} label mode">
                @include('volumes.show.labels')
            </sidebar-tab>
        @endcan
        <sidebar-tab name="filter" icon="filter" title="Filter files" :highlight="filterActive">
            @include('volumes.show.filters')
        </sidebar-tab>
        <sidebar-tab name="sorting" icon="exchange-alt fa-rotate-90" title="Sort files" :highlight="sortingActive">
            @include('volumes.show.sorting')
        </sidebar-tab>
        <sidebar-tab name="charts" icon="chart-bar" title="Show volume charts">
        </sidebar-tab>
        <sidebar-tab name="reports" icon="file" title="Request reports for this volume" href="{{route('volume-reports', $volume->id)}}"></sidebar-tab>
        @canany (['edit-in', 'sudo'], $volume)
            <sidebar-tab name="largo" icon="check-square" title="Perform Largo re-evaluation of annotations for this volume" href="{{ route('largo', $volume->id) }}"></sidebar-tab>
        @endcanany

        @mixin('volumesSidebar')
    </sidebar>
    <div class="sidebar-container__content">
        <loader-block v-cloak :active="loading"></loader-block>
        <div class="volume-content__messages">
            <div v-cloak v-if="filterEmpty" class="panel panel-info">
                <div class="panel-body text-info">
                    There are no {{$type}}s matching your filter rules.
                </div>
            </div>
            @if ($volume->creating_async)
                <div v-cloak v-if="noContent" class="panel panel-warning">
                    <div class="panel-body text-warning">
                        This volume still being processed. Please come back later.
                    </div>
                </div>
            @else
                <div v-cloak v-if="noContent" class="panel panel-info">
                    <div class="panel-body text-info">
                        This volume is empty.
                    </div>
                </div>
            @endif
        </div>
        <image-grid
            empty-url="{{ asset(config('thumbnails.empty_url')) }}"
            :selectable="imageLabelMode"
            :images="filesToShow"
            :initial-offset="initialOffset"
            :selected-label="selectedLabel"
            :show-filenames="showFilenames"
            :show-labels="showLabels"
            :width="{{config('thumbnails.width')}}"
            :height="{{config('thumbnails.height')}}"
            :type="type"
            v-on:scroll="handleScroll"
            ></image-grid>
    </div>
    <statistics-modal
        :show-modal="showStatisticsModal"
        :statistics-data="statisticsData"
        @close-modal="hideStatisticsModal"
        ></statistics-modal>
</div>
@endsection
