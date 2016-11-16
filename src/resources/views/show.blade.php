@extends('app')

@section('title'){{ $tree->name }}@stop

@push('styles')
<link href="{{ cachebust_asset('vendor/label-trees/styles/main.css') }}" rel="stylesheet">
@endpush

@push('scripts')
<script src="{{ cachebust_asset('vendor/label-trees/scripts/main.js') }}"></script>
<script type="text/javascript">
    angular.module('dias.label-trees').constant('LABEL_TREE', {!! $tree !!});
    angular.module('dias.label-trees').constant('LABELS', {!! $labels !!});
    angular.module('dias.label-trees').constant('USER_ID', {!! $user->id !!});
    angular.module('dias.label-trees').constant('REDIRECT_URL', '{{route('label-trees-index')}}');
    @can('update', $tree)
        angular.module('dias.label-trees').constant('AUTH_PROJECTS', {!! $authorizedProjects !!});
        angular.module('dias.label-trees').constant('AUTH_OWN_PROJECTS', {!! $authorizedOwnProjects !!});
        angular.module('dias.label-trees').constant('MEMBERS', {!! $members !!});
        angular.module('dias.label-trees').constant('ROLES', {!! $roles !!});
        angular.module('dias.label-trees').constant('DEFAULT_ROLE_ID', {!! Dias\Role::$editor->id !!});
        angular.module('dias.label-trees').constant('LABEL_SOURCES', {!! $labelSources !!});
    @endcan
</script>
@endpush


@section('content')
<div class="container" data-ng-app="dias.label-trees">
    @include('label-trees::show.title')
    <div class="col-md-6">
        @include('label-trees::show.labels')
    </div>
    <div class="col-md-6">
        @include('label-trees::show.projects')
        @can('update', $tree)
            @include('label-trees::show.authorized-projects')
            @include('label-trees::show.members')
        @endcan
    </div>
</div>
@endsection
