@extends('projects.show.base')

@push('scripts')
<script type="text/javascript">
    biigle.$declare('projects.annotationTimeSeries', {!! $annotationTimeSeries !!});
</script>
@endpush

@section('project-content')
<div id="projects-show-statistics" class="project-statistics">
    <annotation-timeline></annotation-timeline>
    <bar-plot></bar-plot>
    <pie-chart></pie-chart>
    <sankey-plot></sankey-plot>
</div>
@endsection
