@extends('app')
@inject('modules', 'Dias\Services\Modules')

@section('title'){{ $project->name }}@stop

@push('styles')
<link href="{{ asset('vendor/projects/styles/main.css') }}" rel="stylesheet">
@endpush

@push('scripts')
<script src="{{ asset('vendor/projects/scripts/main.js') }}"></script>
<script type="text/javascript">
    angular.module('dias.projects').constant('PROJECT', {!!$project!!});
    angular.module('dias.projects').constant('USER_ID', {!! $user->id !!});
    angular.module('dias.projects').constant('REDIRECT_URL', '{{route('projects-index')}}');
    angular.module('dias.projects').constant('ROLES', {!! $roles !!});
    angular.module('dias.projects').constant('DEFAULT_ROLE_ID', {!! Dias\Role::$guest->id !!});
    angular.module('dias.projects').constant('LABEL_TREES', {!! $labelTrees !!});
    angular.module('dias.projects').constant('TRANSECTS', {!! $transects !!});
    angular.module('dias.projects').constant('MEMBERS', {!! $members !!});
</script>
@foreach ($modules->getMixins('projectsShowScripts') as $module => $nestedMixins)
    @include($module.'::projectsShowScripts')
@endforeach
@endpush

@section('content')
<div class="container" data-ng-app="dias.projects">
    @include('projects::show.title')
    <div class="col-md-6">
        @include('projects::show.transects')
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
