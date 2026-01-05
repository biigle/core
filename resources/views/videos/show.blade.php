@extends('app')
@section('full-navbar', true)
@section('title', "Annotate {$video->name}")

@section('navbar')
<div class="navbar-text navbar-annotations-breadcrumbs">
    @include('volumes.partials.projectsBreadcrumb', ['projects' => $volume->projects]) /
    <a href="{{route('volume', $volume->id)}}" class="navbar-link" title="Show volume {{$volume->name}}">{{$volume->name}}</a> /
    <span id="video-annotations-navbar">
        <breadcrumb
            :file-ids="ids"
            :filenames="filenames"
            :show-indicator="showIndicator"
            :current-file-id="currentId"
            type="video"
            >
            <strong>{{$video->filename}}</strong>
        </breadcrumb>
    </span>
    @include('volumes.partials.annotationSessionIndicator')
</div>
@endsection

@section('content')
<div id="video-container" class="video-container sidebar-container">
    <div
        class="sidebar-container__content"
        v-on:mousemove="updateTimelineHeight"
        v-on:mouseleave="finishUpdateTimelineHeight"
        v-on:mouseup="finishUpdateTimelineHeight"
        v-bind:class="classObject"
        >
        @include('videos.show.content')
    </div>
    <sidebar
        v-cloak
        ref="sidebar"
        :toggle-on-keyboard="true"
        :open-tab="openTab"
        v-on:open="handleOpenedTab"
        v-on:close="handleClosedTab"
        v-on:toggle="handleToggledTab"
        >
            @include('videos.show.sidebar-annotations')
            @can('add-annotation', $video)
                @include('videos.show.sidebar-labels')
            @endcan
            @include('videos.show.sidebar-video-labels')
            @mixin('videosSidebar')
            @include('videos.show.sidebar-settings')
    </sidebar>
</div>
@endsection
@push('scripts')
<script type="module">
    biigle.$declare('videos.volumeId', {{$volume->id}});
    biigle.$declare('videos.id', {{$video->id}});
    biigle.$declare('videos.errors', {!!$errors!!});
    biigle.$declare('videos.videoFileUri', '{!! url('api/v1/videos/:id/file') !!}');
    @can('addAnnotation', $video)
        // TODO Difference bewteen videos.labelTrees and annotations.labelTrees?
        biigle.$declare('videos.labelTrees', {!! $labelTrees !!});
        biigle.$declare('annotations.labelTrees', {!! $labelTrees !!});
        biigle.$declare('labelbot.onnxUrl', '{{config('labelbot.onnx_url')}}'); // This is the right place right?
    @endcan
    biigle.$declare('annotations.shapes', {!! $shapes !!});
    biigle.$declare('annotations.sessions', {!!$annotationSessions!!});
    biigle.$declare('videos.isEditor', @can('add-annotation', $video) true @else false @endcan);
    biigle.$declare('videos.isExpert', @can('force-edit-in', $volume) true @else false @endcan);
    biigle.$declare('videos.videoIds', {!! $videos->keys() !!});
    biigle.$declare('videos.videoFilenames', {!! $videos->values() !!});
    biigle.$declare('videos.user', {!! $user !!});
    biigle.$declare('videos.isAdmin', @can('update', $volume) true @else false @endcan);
    biigle.$declare('videos.thumbUri', '{{ $thumbUriTemplate }}');
    biigle.$declare('videos.spritesThumbnailsPerSprite', {!! $spritesThumbnailsPerSprite !!});
    biigle.$declare('videos.spritesThumbnailInterval', {!! $spritesThumbnailInterval !!});
    biigle.$declare('videos.spritesMaxThumbnails', {!! $spritesMaxThumbnails !!});
    biigle.$declare('videos.spritesMinThumbnails', {!! $spritesMinThumbnails !!});
    biigle.$declare('videos.popupUrl', '{!! route('video-popup') !!}');
</script>
@endpush
