@extends('projects.show.base')

@push('scripts')
<script type="text/javascript">
    @can('update', $project)
        biigle.$declare('projects.canEdit', true);
    @else
        biigle.$declare('projects.canEdit', false);
    @endcan
    biigle.$declare('projects.labelTrees', {!! $labelTrees !!});
</script>
@endpush

@section('project-content')
<div id="projects-show-label-trees" class="project-label-trees">
    <div class="row">
        <div class="col-xs-6">
            <label-tree-list
                v-if="hasLabelTrees"
                :label-trees="labelTrees"
                :editable="canEdit"
                base-uri="{{route('label-trees', '')}}"
                >
            </label-tree-list>
            <div v-else v-cloak class="well">This project has no label trees attached.</div>
        </div>
        @can('update', $project)
            <div class="col-xs-6">
                <span class="top-bar pull-right">
                    <loader :active="loading"></loader>
                    <a href="{{route('label-trees-create', ['project' => $project->id])}}" class="btn btn-default" title="Create a new label tree and attach it to this project" >Create label tree</a>
                    <typeahead :items="attachableLabelTrees" placeholder="Attach label trees" :disabled="loading" v-on:select="attachTree" :clear-on-select="true" :template="typeaheadTemplate" title="Attach a label tree" v-on:focus="fetchAvailableLabelTrees"></typeahead>
                </span>
            </div>
        @endcan
    </div>
</div>
@endsection
