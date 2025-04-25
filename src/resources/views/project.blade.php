@extends('app')
@section('full-navbar', true)
@section('title', $project->name)

@push('scripts')
    <script src="{{ cachebust_asset('vendor/largo/scripts/main.js') }}"></script>
    <script type="text/javascript">
        biigle.$declare('largo.user', {!! $user !!});
        biigle.$declare('largo.projectId', {!! $project->id !!});
        biigle.$declare('largo.labelTrees', {!! $labelTrees !!});
        biigle.$declare('largo.showImageAnnotationRoute', '{{ route('show-image-annotation', '') }}/');
        biigle.$declare('largo.showVideoAnnotationRoute', '{{ route('show-video-annotation', '') }}/');
        biigle.$declare('largo.patchUrlTemplate', '{{$patchUrlTemplate}}');
        biigle.$declare('largo.availableShapes', {!! $shapes !!});
    </script>
@endpush

@push('styles')
    <link href="{{ cachebust_asset('vendor/largo/styles/main.css') }}" rel="stylesheet">
@endpush

@section('navbar')
<div class="navbar-text navbar-largo-breadcrumbs">
    <a href="{{route('project', $project->id)}}" class="navbar-link" title="Show project {{$project->name}}">{{$project->name}}</a> / <span id="largo-title">Largo / <strong v-if="isInDismissStep">dismiss existing annotations</strong><strong v-cloak v-else>relabel dismissed annotations</strong> <small>(<span v-text="shownCount">0</span>&nbsp;annotations)</small></span>
</div>
@endsection

@section('content')
<div id="project-largo-container" class="sidebar-container">
    @include('largo::show.content')
</div>
@endsection
