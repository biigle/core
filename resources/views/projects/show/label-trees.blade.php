@extends('projects.show.base')

@push('scripts')
<script type="text/javascript">
    biigle.$declare('projects.labelTrees', {!! $labelTrees !!});
</script>
@endpush

@section('project-content')
<div id="projects-show-label-trees" class="project-label-trees">
    <div class="row">
        <div class="col-xs-6">
            <ul v-if="hasLabelTrees" class="list-group">
                <li v-cloak class="list-group-item" v-for="tree in labelTrees">
                    <h4 class="list-group-item-heading">
                        @can('update', $project)
                            <button type="button" class="btn btn-default btn-sm pull-right" title="Detach this label tree" v-on:click="removeTree(tree)"><i class="fa fa-trash"></i></button>
                        @endcan
                        <a :href="'{{route('label-trees', '')}}/' + tree.id" v-text="tree.name"></a>
                    </h4>
                    <p v-if="tree.description" class="list-group-item-text" v-text="tree.description"></p>
                </li>
            </ul>
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
