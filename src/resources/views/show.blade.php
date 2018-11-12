@extends('app')
@section('full-navbar', true)

@section('title', "Annotate {$image->filename}")

@push('scripts')
<script src="{{ cachebust_asset('vendor/label-trees/scripts/main.js') }}"></script>
<script src="{{ cachebust_asset('vendor/volumes/scripts/main.js') }}"></script>
@if (app()->environment('local') && File::exists(public_path('vendor/annotations/scripts/ol-debug.js')))
    <script src="{{ cachebust_asset('vendor/annotations/scripts/ol-debug.js') }}"></script>
@else
    <script src="{{ cachebust_asset('vendor/annotations/scripts/ol.js') }}"></script>
@endif
<script src="{{ cachebust_asset('vendor/annotations/scripts/glfx.js') }}"></script>
<script src="{{ cachebust_asset('vendor/annotations/scripts/magic-wand-min.js') }}"></script>
<script src="{{ cachebust_asset('vendor/annotations/scripts/main.js') }}"></script>
<script type="text/javascript">
    @can('add-annotation', $image)
        biigle.$declare('annotations.labelTrees', {!! $labelTrees !!});
    @endcan
    biigle.$declare('annotations.imageId', {!! $image->id !!});
    biigle.$declare('annotations.volumeId', {!! $image->volume_id !!});
    biigle.$declare('annotations.shapes', {!! $shapes !!});
    biigle.$declare('annotations.imagesIds', {!! $images->keys() !!});
    biigle.$declare('annotations.imagesFilenames', {!! $images->values() !!});
    biigle.$declare('annotations.imageFileUri', '{!! url('api/v1/images/{id}/file') !!}');
    biigle.$declare('annotations.tilesUri', '{{ asset(config('image.tiles.uri')) }}/{uuid}/');
    biigle.$declare('annotations.sessions', {!!$annotationSessions!!});
    biigle.$declare('annotations.isEditor', @can('add-annotation', $image) true @else false @endcan);
    biigle.$declare('annotations.userId', {!! $user->id !!});
    biigle.$declare('annotations.isAdmin', @can('update', $volume) true @else false @endcan);

</script>
@mixin('annotationsScripts')
@endpush

@push('styles')
<link href="{{ cachebust_asset('vendor/label-trees/styles/main.css') }}" rel="stylesheet">
<link href="{{ cachebust_asset('vendor/volumes/styles/main.css') }}" rel="stylesheet">
<link href="{{ cachebust_asset('vendor/annotations/styles/ol.css') }}" rel="stylesheet">
<link href="{{ cachebust_asset('vendor/annotations/styles/main.css') }}" rel="stylesheet">
@mixin('annotationsStyles')
@endpush

@section('navbar')
<div class="navbar-text navbar-annotations-breadcrumbs">
    @include('volumes::partials.projectsBreadcrumb', ['projects' => $volume->projects]) /
    <a href="{{route('volume', $volume->id)}}" class="navbar-link" title="Show volume {{$volume->name}}">{{$volume->name}}</a> /
    <span id="annotations-navbar">
        @include('annotations::show.progressIndicator')<strong v-bind:title="filenameTitle" v-bind:class="filenameClass" v-text="currentImageFilename">{{$image->filename}}</strong>
    </span>
    @include('volumes::partials.annotationSessionIndicator')
</div>
@endsection

@section('content')
<div id="annotator-container" class="sidebar-container" v-cloak>
    <div class="sidebar-container__content">
        <loader-block :active="loading"></loader-block>
        <annotation-canvas
            :can-add="isEditor"
            :can-modify="isEditor"
            :can-delete="isEditor"
            :image="image"
            :annotations="filteredAnnotations"
            :selected-annotations="selectedAnnotations"
            :last-created-annotation="lastCreatedAnnotation"
            :center="mapCenter"
            :resolution="mapResolution"
            :selected-label="selectedLabel"
            :annotation-opacity="annotationOpacity"
            :annotation-mode="annotationMode"
            :show-mouse-position="showMousePosition"
            :show-zoom-level="showZoomLevel"
            :show-scale-line="showScaleLine"
            :images-area="imagesArea"
            :show-label-tooltip="showLabelTooltip"
            :show-measure-tooltip="showMeasureTooltip"
            :show-minimap="showMinimap"
            v-on:moveend="handleMapMoveend"
            v-on:previous="handlePrevious"
            v-on:next="handleNext"
            v-on:new="handleNewAnnotation"
            v-on:select="handleSelectAnnotations"
            v-on:update="handleUpdateAnnotations"
            v-on:attach="handleAttachLabel"
            v-on:delete="handleDeleteAnnotations"
            ref="canvas"
            inline-template>
            @include('annotations::show.annotationCanvas')
        </annotation-canvas>
    </div>
    <sidebar :open-tab="openTab" :toggle-on-keyboard="true" v-on:open="handleOpenedTab" v-on:close="handleClosedTab" v-cloak>
        @include('annotations::show.tabs.annotations')
        @can('add-annotation', $image)
            @include('annotations::show.tabs.labels')
        @endcan
        @include('annotations::show.tabs.annotationModes')
        @include('annotations::show.tabs.imageLabels')
        @include('annotations::show.tabs.colorAdjustment')
        @include('annotations::show.tabs.settings')
    </sidebar>
</div>
@endsection
