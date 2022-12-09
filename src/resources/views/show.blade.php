@extends('app')
@section('full-navbar', true)
@section('title', $volume->name)

@push('scripts')
    <script src="{{ cachebust_asset('vendor/largo/scripts/main.js') }}"></script>
    <script type="text/javascript">
        biigle.$declare('largo.user', {!! $user !!});
        biigle.$declare('largo.volumeId', {!! $volume->id !!});
        biigle.$declare('largo.mediaType', @if ($volume->isImageVolume()) 'image' @else 'video' @endif);
        biigle.$declare('largo.labelTrees', {!! $labelTrees !!});
        biigle.$declare('largo.showImageAnnotationRoute', '{{ route('show-image-annotation', '') }}/');
        biigle.$declare('largo.showVideoAnnotationRoute', '{{ route('show-video-annotation', '') }}/');
        biigle.$declare('largo.patchUrlTemplate', '{{$patchUrlTemplate}}');
    </script>
@endpush

@push('styles')
    <link href="{{ cachebust_asset('vendor/largo/styles/main.css') }}" rel="stylesheet">
@endpush

@section('navbar')
<div class="navbar-text navbar-largo-breadcrumbs">
    @include('volumes.partials.projectsBreadcrumb') / <a href="{{route('volume', $volume->id)}}" title="Show volume {{$volume->name}}" class="navbar-link">{{$volume->name}}</a> / <span id="largo-title">Largo / <strong v-if="isInDismissStep">dismiss existing annotations</strong><strong v-cloak v-else>re-label dismissed annotations</strong> <small>(<span v-text="shownCount">0</span>&nbsp;annotations)</small></span> @include('volumes.partials.annotationSessionIndicator')
</div>
@endsection

@section('content')
<div id="largo-container" class="sidebar-container">
    @include('largo::show.content')
</div>
@endsection
