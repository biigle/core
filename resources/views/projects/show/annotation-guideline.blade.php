@extends('projects.show.base')

@push('scripts')
<script type="module">
    biigle.$declare('projects.labelTrees', @json($labelTrees));
    biigle.$declare('projects.availableShapes', @json($availableShapes));
    biigle.$declare('projects.annotationGuideline', @json($annotationGuideline));
    biigle.$declare('projects.annotationGuidelineLabels', @json($annotationGuidelineLabels));
    biigle.$declare('projects.annotationGuidelineLabelsBaseUrl', "{!! Storage::disk(config('annotation_guideline.storage_disk'))->url("$project->id") !!}");
</script>
@endpush

@section('project-content')
<div id="annotation-guideline-container">
    <div class="row">
        <div class="col-xl-12">
            <annotation-guideline
            :is-admin={{ $isAdmin ? 'true' : 'false' }}>
            </annotation-guideline>
        </div>
    </div>
</div>
@endsection
