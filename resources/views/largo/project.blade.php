@extends('app')
@section('full-navbar', true)
@section('title', $project->name)

@push('scripts')
    <script type="module">
        biigle.$declare('largo.user', {{Js::from($user)}});
        biigle.$declare('largo.projectId', {!! $project->id !!});
        biigle.$declare('largo.labelTrees', {{Js::from($labelTrees)}});
        biigle.$declare('largo.showImageAnnotationRoute', '{{ route('show-image-annotation', '/') }}/');
        biigle.$declare('largo.showVideoAnnotationRoute', '{{ route('show-video-annotation', '/') }}/');
        biigle.$declare('largo.patchUrlTemplate', '{{$patchUrlTemplate}}');
        biigle.$declare('largo.availableShapes', {!! $shapes !!});
    </script>
@endpush

@section('navbar')
<div class="navbar-text navbar-largo-breadcrumbs">
    <a href="{{route('project', $project->id)}}" class="navbar-link" title="Show project {{$project->name}}">{{$project->name}}</a> / <span id="largo-title">Largo / <strong v-if="isInDismissStep">dismiss existing annotations</strong><strong v-cloak v-else>relabel dismissed annotations</strong> <small>(<span v-if="false">0</span><span v-text="shownCount"></span>&nbsp;annotations)</small></span>
</div>
@endsection

@section('content')
<div id="project-largo-container" class="sidebar-container">
    @include('largo.show.content')
</div>
@endsection
