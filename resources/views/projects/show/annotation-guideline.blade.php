@extends('projects.show.base')

@push('scripts')
<script type="module">
    biigle.$declare('projects.labelTrees', @json($labelTrees));
    biigle.$declare('projects.availableShapes', @json($availableShapes));
    biigle.$declare('projects.annotationGuideline', @json($annotationGuideline));
</script>
@endpush

@section('project-content')
<div id="annotation-guideline-container">
    <div class="row">
        <div class="col-sm-12">
            <annotation-guideline
            :is-admin={{ $isAdmin ? 'true' : 'false' }}
            print-url="{{ route('annotation-guideline-print', ['id' => $project->id, 'print' => 1]) }}">
            </annotation-guideline>
        </div>
    </div>
</div>
@endsection
