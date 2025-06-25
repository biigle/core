@extends('projects.show.base')

@push('scripts')
<script type="module">
    biigle.$declare('projects.annotationTimeSeries', {{Js::from($annotationTimeSeries)}});
    biigle.$declare('projects.volumeAnnotations', {{Js::from($volumeAnnotations)}});
    biigle.$declare('projects.volumeNames', {{Js::from($volumeNames)}});
    biigle.$declare('projects.annotatedImages', {!! $annotatedImages !!});
    biigle.$declare('projects.totalImages', {!! $totalImages !!});
    biigle.$declare('projects.annotationLabels', {{Js::from($annotationLabels)}});
    biigle.$declare('projects.sourceTargetLabels', {!! $sourceTargetLabels !!});
    biigle.$declare('projects.volumes', {{Js::from($volumes)}});
    biigle.$declare('projects.totalVideos', {!! $totalVideos !!});
    biigle.$declare('projects.annotatedVideos', {!! $annotatedVideos !!});
    biigle.$declare('projects.annotationTimeSeriesVideo', {{Js::from($annotationTimeSeriesVideo)}});
    biigle.$declare('projects.volumeAnnotationsVideo', {{Js::from($volumeAnnotationsVideo)}});
    biigle.$declare('projects.volumeNamesVideo', {{Js::from($volumeNamesVideo )}});
    biigle.$declare('projects.annotationLabelsVideo', {{Js::from($annotationLabelsVideo)}});
    biigle.$declare('projects.sourceTargetLabelsVideo', {!! $sourceTargetLabelsVideo !!});
</script>
@endpush

@section('project-content')
<div id="projects-show-statistics" class="project-volume-charts">
    <span class="btn-group">
        <button class="btn btn-default" :class="toggleImageVolumesClass" title="Show statistics of image volumes only" v-on:click="toggleImageVolumes" :disabled="(!hasVolumes || !hasMixedMediaTypes) || null"><i class="fa fa-image"></i></button>
        <button class="btn btn-default" :class="toggleVideoVolumesClass" title="Show statistics of video volumes only" v-on:click="toggleVideoVolumes" :disabled="(!hasVolumes || !hasMixedMediaTypes) || null"><i class="fa fa-film"></i></button>
    </span>
    <annotation-timeline v-if="showTimeline"
        :annotation-time-series="computedData.annotationTimeSeries"
        :container="container"
        :subtitle="subtitle[0]"
        ></annotation-timeline>
    <sankey-plot v-if="showSankey"
        :volume-annotations="computedData.volumeAnnotations" 
        :names="computedData.volumeNames"
        :container="container"
        ></sankey-plot>
    <pie-chart
        :total-files="computedData.totalFiles" 
        :annotated-files="computedData.annotatedFiles"
        :container="container"
        :subtitle="subtitle[1]"
        ></pie-chart>
    <pie-label v-if="showPieLabel"
        :annotation-labels="computedData.annotationLabels"
        :container="container"
        :subtitle="subtitle[1]"
        ></pie-label>
    <net-map v-if="showNetMap"
        :annotation-labels="computedData.annotationLabels" 
        :source-target-labels="computedData.sourceTargetLabels"
        :container="container"
        ></net-map>
</div>
@endsection
