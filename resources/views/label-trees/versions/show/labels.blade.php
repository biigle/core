@extends('label-trees.versions.show.base')

@push('scripts')
<script type="text/javascript">
    biigle.$declare('labelTrees.labels', {!! $labels !!});
</script>
@endpush

@section('label-tree-version-content')
<div class="row">
    <div class="col-md-6">
        @include('label-trees.show.labels-panel')
    </div>
</div>
@endsection
