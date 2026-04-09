@extends('projects.show.base')

@push('scripts')
<script type="module">
    biigle.$declare('projects.labelTrees', @json($labelTrees));
    biigle.$declare('projects.availableShapes', @json($availableShapes));
    biigle.$declare('projects.annotationStrategy', @json($annotationStrategy));
    biigle.$declare('projects.annotationStrategyLabels', @json($annotationStrategyLabels));
    biigle.$declare('projects.annotationStrategyLabelsBaseUrl', "{!! Storage::disk(config('annotation_strategy.storage_disk'))->url("$project->id") !!}");
</script>
@endpush

@section('project-content')
<div id="annotation-strategy-container">
    <div class="row">
        <div class="col-xl-12">
            <annotation-strategy
            :is-admin={{ $isAdmin ? 'true' : 'false' }}>
            </annotation-strategy>
        </div>
    </div>
</div>
@endsection
