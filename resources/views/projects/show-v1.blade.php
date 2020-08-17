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
</script>
@mixin('projectsShowScripts')
@endpush

@section('content')
<div class="container">
    @include('projects.show-v1.title')
    @include('projects.show-v1.toolbar')
    <div class="col-md-6">
        @include('projects.show-v1.volumes')
        @mixin('projectsShowLeft')
    </div>
    <div class="col-md-6">
        @include('projects.show-v1.label-trees')
        @include('projects.show-v1.members')
        @mixin('projectsShow')
        @mixin('projectsShowRight')
    </div>
</div>
@endsection
