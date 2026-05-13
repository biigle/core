@extends('projects.show.base')

@push('scripts')
<script type="module">
    biigle.$declare('projects.labelTrees', @json($labelTrees));
    biigle.$declare('projects.availableShapes', @json($availableShapes));
    biigle.$declare('projects.annotationGuideline', @json($annotationGuideline));
    biigle.$declare('projects.annotationGuidelineLabelsBaseUrl', "{!! Storage::disk(config('projects.annotation_guideline_storage_disk'))->url("$project->id") !!}");
</script>
@endpush

@section('project-content')
<div id="annotation-guideline-container">
    <div class="row">
        <div class="col-sm-12">
            <annotation-guideline
            :is-admin={{ $isAdmin ? 'true' : 'false' }}>
            </annotation-guideline>
        </div>
    </div>
</div>
@endsection
