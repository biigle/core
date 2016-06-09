@extends('app')

@section('title'){{ $tree->name }}@stop

@push('styles')
<link href="{{ asset('vendor/label-trees/styles/main.css') }}" rel="stylesheet">
@endpush

@push('scripts')
<script src="{{ asset('vendor/label-trees/scripts/main.js') }}"></script>
<script type="text/javascript">
    angular.module('dias.label-trees').constant('LABEL_TREE', {!! $tree !!});
    angular.module('dias.label-trees').constant('LABELS', {!! $labels !!});
    @can('update', $tree)
        angular.module('dias.label-trees').constant('AUTH_PROJECTS', {!! $authorizedProjects !!});
        angular.module('dias.label-trees').constant('AUTH_OWN_PROJECTS', {!! $authorizedOwnProjects !!});
        angular.module('dias.label-trees').constant('MEMBERS', {!! $members !!});
        angular.module('dias.label-trees').constant('ROLES', {!! $roles !!});
        angular.module('dias.label-trees').constant('USER_ID', {!! $user->id !!});
    @endcan
</script>
@endpush


@section('content')
<div class="container" data-ng-app="dias.label-trees">
    @include('label-trees::index.title')
    <div class="col-md-6">
        @include('label-trees::index.labels')
    </div>
    <div class="col-md-6">
        @include('label-trees::index.projects')
        @can('update', $tree)
            @include('label-trees::index.authorized-projects')
            @include('label-trees::index.members')
        @endcan
    </div>
</div>
@endsection
