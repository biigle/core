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
    biigle.$declare('projects.volumes', {!! $volumes !!});
    biigle.$declare('projects.totalVideos', {!! $totalVideos !!});
    biigle.$declare('projects.annotatedVideos', {!! $annotatedVideos !!});
    biigle.$declare('projects.annotationTimeSeriesVideo', {!! $annotationTimeSeriesVideo !!});
    biigle.$declare('projects.volumeAnnotationsVideo', {!! $volumeAnnotationsVideo !!});
    biigle.$declare('projects.volumeNamesVideo', {!! $volumeNamesVideo !!});
    biigle.$declare('projects.annotationLabelsVideo', {!! $annotationLabelsVideo !!});
    biigle.$declare('projects.sourceTargetLabelsVideo', {!! $sourceTargetLabelsVideo !!});
</script>
@endpush

@section('project-content')
<div id="projects-show-statistics" class="project-statistics">
    <span class="btn-group">
        <button class="btn btn-default" :class="toggleImageVolumesClass" title="Show statistics of image volumes only" v-on:click="toggleImageVolumes" :disabled="!hasVolumes || !hasMixedMediaTypes"><i class="fa fa-image"></i></button>
        <button class="btn btn-default" :class="toggleVideoVolumesClass" title="Show statistics of video volumes only" v-on:click="toggleVideoVolumes" :disabled="!hasVolumes || !hasMixedMediaTypes"><i class="fa fa-film"></i></button>
    </span>
    <annotation-timeline v-if="showTimeline" 
        :annotation-time-series="computedData.annotationTimeSeries"
        :container="container"
        :subtitle="subtitle[0]"
        ></annotation-timeline>
    <!-- <bar-plot :volume-annotations="volumeAnnotations" :names="volumeNames"></bar-plot> -->
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
