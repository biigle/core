@extends('label-trees.show.base')

@push('scripts')
<script type="text/javascript">
    biigle.$declare('labelTrees.labels', {!! $labels !!});
    biigle.$declare('labelTrees.wormsLabelSource', {!! $wormsLabelSource !!});

    {{--@can('update', $tree)
        biigle.$declare('labelTrees.members', {!! $members !!});
        biigle.$declare('labelTrees.roles', {!! $roles !!});
        biigle.$declare('labelTrees.defaultRoleId', {!! Biigle\Role::editorId() !!});
    @endcan--}}
</script>
@endpush

@section('label-tree-content')
<div class="row">
    <div class="col-md-6">
        @include('label-trees.show.labels-panel')
    </div>
    {{-- <div class="col-md-6">
        @can('update', $tree)
            @include('label-trees.show.members')
        @endcan
    </div> --}}
</div>
@endsection
