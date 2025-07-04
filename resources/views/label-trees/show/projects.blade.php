@extends('label-trees.show.base')

@push('scripts')
<script type="module">
    @can('update', $tree)
        biigle.$declare('labelTrees.authorizedProjects', {{ Js::from($authorizedProjects ) }});
        biigle.$declare('labelTrees.authorizedOwnProjects', {!! $authorizedOwnProjects !!});
    @endcan
</script>
@endpush

@section('label-tree-content')
<div class="row">
    <div class="col-xs-6">
        @include('label-trees.show.projects-list')
    </div>
    <div class="col-xs-6">
        @can('update', $tree)
            @include('label-trees.show.authorized-projects')
        @endcan
    </div>
</div>
@endsection
