@extends('app')

@section('title', $tree->name)

@push('styles')
<link href="{{ cachebust_asset('vendor/label-trees/styles/main.css') }}" rel="stylesheet">
@mixin('labelTreesShowStyles')
@endpush

@push('scripts')
<script src="{{ cachebust_asset('vendor/label-trees/scripts/main.js') }}"></script>
<script type="text/javascript">
    biigle.$declare('labelTrees.labelTree', {!! $tree !!});
    biigle.$declare('labelTrees.labels', {!! $labels !!});
    biigle.$declare('labelTrees.privateVisibilityId', {!! \Biigle\Visibility::privateId() !!});
    biigle.$declare('labelTrees.userId', {!! $user->id !!});
    biigle.$declare('labelTrees.redirectUrl', '{{route('home')}}');
    biigle.$declare('labelTrees.wormsLabelSource', {!! $wormsLabelSource !!});

    @can('update', $tree)
        biigle.$declare('labelTrees.authorizedProjects', {!! $authorizedProjects !!});
        biigle.$declare('labelTrees.authorizedOwnProjects', {!! $authorizedOwnProjects !!});

        biigle.$declare('labelTrees.members', {!! $members !!});
        biigle.$declare('labelTrees.roles', {!! $roles !!});
        biigle.$declare('labelTrees.defaultRoleId', {!! Biigle\Role::editorId() !!});
    @endcan
</script>
@mixin('labelTreesShowScripts')
@endpush


@section('content')
<div class="container">
    @include('label-trees::show.title')
    @include('label-trees::show.toolbar')
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
