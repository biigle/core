@extends('label-trees.show.base')

@push('scripts')
<script type="module">
    biigle.$declare('labelTrees.labels', {!! $labels !!});
    biigle.$declare('labelTrees.wormsLabelSource', {!! $wormsLabelSource !!});
    @can('create-label', $tree)
        biigle.$declare('labelTrees.canEdit', true);
    @else
        biigle.$declare('labelTrees.canEdit', false);
    @endcan
</script>
@endpush

@section('label-tree-content')
    @include('label-trees.show.labels-container')
@endsection
