@extends('label-trees.show.base')

@push('scripts')
<script type="text/javascript">
    @can('update', $tree)
        biigle.$declare('labelTrees.authorizedProjects', {!! $authorizedProjects !!});
        biigle.$declare('labelTrees.authorizedOwnProjects', {!! $authorizedOwnProjects !!});
    @endcan
</script>
@endpush

@section('label-tree-content')
<div class="row">
    <div class="col-md-6">
        @include('label-trees.show.projects-panel')
        @can('update', $tree)
            @include('label-trees.show.authorized-projects')
        @endcan
    </div>
</div>
@endsection
