@extends('app')
@section('title', $project->name)

@push('scripts')
<script type="module">
    biigle.$declare('projects.project', {{Js::from($project)}});
    biigle.$declare('projects.userId', {!! $user->id !!});
    biigle.$declare('projects.redirectUrl', '{{route('home')}}');
</script>
@endpush

@section('content')
<div class="container">
    @include('projects.show.title')
    @include('projects.show.tabs')
    @yield('project-content')
</div>
@endsection
