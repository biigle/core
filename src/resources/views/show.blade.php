@extends('app')
@inject('modules', 'Biigle\Services\Modules')

@section('title'){{ $project->name }}@stop

@push('styles')
<link href="{{ cachebust_asset('vendor/projects/styles/main.css') }}" rel="stylesheet">
@endpush

@push('scripts')
<script src="{{ cachebust_asset('vendor/projects/scripts/main.js') }}"></script>
<script src="{{ cachebust_asset('vendor/projects/scripts/vue.js') }}"></script>
<script type="text/javascript">
    angular.module('biigle.projects').constant('PROJECT', {!!$project!!});
    angular.module('biigle.projects').constant('LABEL_TREES', {!! $labelTrees !!});

    biigle.$declare('projects.volumes', {!! $volumes !!});
    biigle.$declare('projects.project', {!!$project!!});
    biigle.$declare('projects.members', {!! $members !!});
    biigle.$declare('projects.roles', {!! $roles !!});
    biigle.$declare('projects.defaultRoleId', {!! Biigle\Role::$guest->id !!});
    biigle.$declare('projects.userId', {!! $user->id !!});
    biigle.$declare('projects.redirectUrl', '{{route('projects-index')}}');
</script>
@foreach ($modules->getMixins('projectsShowScripts') as $module => $nestedMixins)
    @include($module.'::projectsShowScripts')
@endforeach
@endpush

@section('content')
<div class="container" data-ng-app="biigle.projects">
    @include('projects::show.title')
    @include('projects::show.toolbar')
    <div class="col-md-6">
        @include('projects::show.volumes')
    </div>
    <div class="col-md-6">
        @include('projects::show.label-trees')
        @include('projects::show.members')
        @foreach ($modules->getMixins('projectsShow') as $module => $nestedMixins)
            @include($module.'::projectsShow')
        @endforeach
    </div>
</div>
@endsection
