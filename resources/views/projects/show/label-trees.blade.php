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
                v-on:remove="removeTree"
                >
            </label-tree-list>
            <div v-else v-cloak class="well">This project has no label trees attached.</div>
        </div>
        <div class="col-xs-6">
            <span class="top-bar pull-right">
                @can('update', $project)
                    <loader :active="loading"></loader>
                    <a href="{{route('label-trees-create', ['project' => $project->id])}}" class="btn btn-default" title="Create a new label tree and attach it to this project" >Create Label Tree</a>
                    <scrollable-typeahead :items="attachableLabelTrees" placeholder="Attach label tree" :disabled="loading" v-on:select="attachTree" :clear-on-select="true" more-info="description" title="Attach a label tree" v-on:fetch="fetchAvailableLabelTrees"></scrollable-typeahead>
                @else
                    <span class="text-muted">Project admins can add and remove label trees.</span>
                @endcan
            </span>
        </div>
    </div>
</div>
@endsection
