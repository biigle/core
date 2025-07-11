@extends('label-trees.versions.show.base')

@push('scripts')
<script type="module">
    biigle.$declare('labelTrees.labels', {{ Js::from($labels) }});
    biigle.$declare('labelTrees.canEdit', false);
</script>
@endpush

@section('label-tree-version-content')
    @include('label-trees.show.labels-container')
@endsection
