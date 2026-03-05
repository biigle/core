@extends('projects.show.base')

@push('scripts')
<script type="module">
    biigle.$declare('projects.labelTrees', @json($labelTrees));
    biigle.$declare('projects.availableShapes', @json($availableShapes));
</script>
@endpush

//todo: convert annotationStrategy
@section('project-content')
<div id="annotation-strategy-container">
    <div class="row">
        <div class="col-xl-12">
            <annotation-strategy
            :annotation-strategy=@json($annotationStrategy)
            :annotation-strategy-labels=@json($annotationStrategyLabels)
            :is-admin={{ $isAdmin ? 'true' : 'false' }}></annotation-strategy>
        </div>
    </div>
</div>
@endsection
