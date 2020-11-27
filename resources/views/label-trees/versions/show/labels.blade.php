@extends('label-trees.versions.show.base')

@push('scripts')
<script type="text/javascript">
    biigle.$declare('labelTrees.labels', {!! $labels !!});
    biigle.$declare('labelTrees.canEdit', false);
</script>
@endpush

@section('label-tree-version-content')
    @include('label-trees.show.labels-container')
@endsection
