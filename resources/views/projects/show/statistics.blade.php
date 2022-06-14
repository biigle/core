@extends('projects.show.base')

@push('scripts')
<script type="text/javascript">
    biigle.$declare('projects.annotationTimeSeries', {!! $annotationTimeSeries !!});
    biigle.$declare('projects.volumeAnnotations', {!! $volumeAnnotations !!});
    biigle.$declare('projects.volumeNames', {!! $volumeNames !!});

</script>
@endpush

@section('project-content')
<div id="projects-show-statistics" class="project-statistics">
    <annotation-timeline :annotation-time-series="annotationTimeSeries"></annotation-timeline>
    <bar-plot :volume-annotations="volumeAnnotations" :names="volumeNames"></bar-plot>
    <pie-chart></pie-chart>
    <sankey-plot></sankey-plot>
    <net-map></net-map>
</div>
@endsection
