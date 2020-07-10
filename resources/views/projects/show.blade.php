@extends('app')
@section('title', $project->name)

@push('scripts')
<script type="text/javascript">
    biigle.$declare('projects.volumes', {!! $volumes !!});
    biigle.$declare('projects.project', {!!$project!!});
    biigle.$declare('projects.members', {!! $members !!});
    biigle.$declare('projects.roles', {!! $roles !!});
    biigle.$declare('projects.defaultRoleId', {!! Biigle\Role::guestId() !!});
    biigle.$declare('projects.userId', {!! $user->id !!});
    biigle.$declare('projects.redirectUrl', '{{route('home')}}');
    biigle.$declare('projects.labelTrees', {!! $labelTrees !!});
    biigle.$declare('projects.videos', {!! $videos !!});
</script>
@mixin('projectsShowScripts')
@endpush

@section('content')
<div class="container">
    @include('projects.show.title')
    @include('projects.show.toolbar')
    <div class="col-md-6">
        @include('projects.show.volumes')
        @include('projects.show.videos')
        @mixin('projectsShowLeft')
    </div>
    <div class="col-md-6">
        @include('projects.show.label-trees')
        @include('projects.show.members')
        @mixin('projectsShow')
        @mixin('projectsShowRight')
    </div>
</div>
@endsection
