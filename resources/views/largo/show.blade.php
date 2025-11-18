@extends('app')
@section('full-navbar', true)
@section('title', $volume->name)

@push('scripts')
    <script type="module">
        biigle.$declare('largo.user', {!! $user !!});
        biigle.$declare('largo.volumeId', {!! $volume->id !!});
        biigle.$declare('largo.projectIds', {!! $volume->projects()->pluck('id') !!});
        biigle.$declare('largo.mediaType', @if ($volume->isImageVolume()) 'image' @else 'video' @endif);
        biigle.$declare('largo.labelTrees', {!! $labelTrees !!});
        biigle.$declare('largo.showImageAnnotationRoute', '{{ route('show-image-annotation', '/') }}/');
        biigle.$declare('largo.showVideoAnnotationRoute', '{{ route('show-video-annotation', '/') }}/');
        biigle.$declare('largo.patchUrlTemplate', '{{$patchUrlTemplate}}');
        biigle.$declare('largo.availableShapes', {!! $shapes !!})
    </script>
@endpush

@section('navbar')
<div class="navbar-text navbar-largo-breadcrumbs">
    @include('volumes.partials.projectsBreadcrumb') / <a href="{{route('volume', $volume->id)}}" title="Show volume {{$volume->name}}" class="navbar-link">{{$volume->name}}</a> / <span id="largo-title">Largo / <strong v-if="isInDismissStep">dismiss existing annotations</strong><strong v-cloak v-else>relabel dismissed annotations</strong> <small>(<span v-if="false">0</span><span v-text="shownCount"></span>&nbsp;annotations)</small></span> @include('volumes.partials.annotationSessionIndicator')
</div>
@endsection

@section('content')
<div id="largo-container" class="sidebar-container">
    @include('largo.show.content')
</div>
@endsection
