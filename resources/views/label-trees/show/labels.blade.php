@extends('label-trees.show.base')

@push('scripts')
<script type="module">
    biigle.$declare('labelTrees.labels', {{Js::from($labels)}});
    biigle.$declare('labelTrees.wormsLabelSource', {{Js::from($wormsLabelSource)}});
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
