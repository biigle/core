@extends('projects.show.base')

@push('scripts')
<script type="text/javascript">
    biigle.$declare('projects.members', {!! $members !!});
</script>
@endpush

@section('project-content')
<div id="projects-show-members" class="project-members">
    <div class="row">
        <div class="col-xs-6">
            <ul class="list-group">
                <li v-cloak class="list-group-item" v-for="member in members">
                    <h4 class="list-group-item-heading">
                        @can('update', $project)
                            <button v-if="member.id !== userId" type="button" class="btn btn-default btn-sm pull-right" title="Remove this member" v-on:click="removeMember(member)"><i class="fa fa-trash"></i></button>
                        @endcan
                        <span v-text="member.name"></span> <span v-if="member.id === userId" class="text-muted">(you)</span>
                    </h4>
                    <p v-if="member.affiliation" class="list-group-item-text" v-text="member.affiliation"></p>
                </li>
            </ul>
        </div>
        @can('update', $project)
            <div class="col-xs-6">
                <span class="top-bar pull-right">
                    <loader :active="loading"></loader>
                    {{-- <typeahead :items="attachableLabelTrees" placeholder="Attach label trees" :disabled="loading" v-on:select="attachTree" :clear-on-select="true" :template="typeaheadTemplate" title="Attach a label tree" v-on:focus="fetchAvailableLabelTrees"></typeahead> --}}
                </span>
            </div>
        @endcan
    </div>
</div>
@endsection
