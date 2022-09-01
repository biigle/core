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
    <annotation-timeline v-if="showTimeline" :annotation-time-series="annotationTimeSeries" :container="container"></annotation-timeline>
    <!-- <bar-plot :volume-annotations="volumeAnnotations" :names="volumeNames"></bar-plot> -->
    <sankey-plot v-if="showSankey" :volume-annotations="volumeAnnotations" :names="volumeNames"></sankey-plot>
    <pie-chart :total-images="totalImages" :annotated-images="annotatedImages" :container="container"></pie-chart>
    <pie-label v-if="showPieLabel" :annotation-labels="annotationLabels" :container="container"></pie-label>
    <net-map v-if="showNetMap" :annotation-labels="annotationLabels" :source-target-labels="sourceTargetLabels"></net-map>
</div>
@endsection
