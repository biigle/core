@extends('projects.show.base')

@push('scripts')
<script type="text/javascript">
    biigle.$declare('projects.annotationTimeSeries', {!! $annotationTimeSeries !!});
    biigle.$declare('projects.volumeAnnotations', {!! $volumeAnnotations !!});
    biigle.$declare('projects.volumeNames', {!! $volumeNames !!});
    biigle.$declare('projects.annotatedImages', {!! $annotatedImages !!});
    biigle.$declare('projects.totalImages', {!! $totalImages !!});
    biigle.$declare('projects.annotationLabels', {!! $annotationLabels !!});
    biigle.$declare('projects.sourceTargetLabels', {!! $sourceTargetLabels !!});


</script>
@endpush

@section('project-content')
<div id="projects-show-statistics" class="project-statistics">
    <annotation-timeline :annotation-time-series="annotationTimeSeries"></annotation-timeline>
    <!-- <bar-plot :volume-annotations="volumeAnnotations" :names="volumeNames"></bar-plot> -->
    <pie-chart :total-images="totalImages" :annotated-images="annotatedImages"></pie-chart>
    <sankey-plot :volume-annotations="volumeAnnotations" :names="volumeNames"></sankey-plot>
    <pie-label></pie-label>
    <net-map :annotation-labels="annotationLabels" :source-target-labels="sourceTargetLabels"></net-map>
</div>
@endsection
