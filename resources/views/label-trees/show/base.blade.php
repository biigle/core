@extends('app')

@section('title', $tree->name)

@push('styles')
@mixin('labelTreesShowStyles')
@endpush

@push('scripts')
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
    @include('label-trees.show.title')
    @include('label-trees.show.tabs')
    @yield('label-tree-content')
</div>
@endsection
