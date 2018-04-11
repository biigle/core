@extends('admin.base')

@section('title', 'Label Tree Import')

@push('styles')
<link href="{{ cachebust_asset('vendor/sync/styles/main.css') }}" rel="stylesheet">
@endpush

@push('scripts')
<script type="text/javascript">
    biigle.$declare('sync.importToken', '{{$token}}');
    biigle.$declare('sync.labelTreeCandidates', {!!$labelTreeCandidates->toJson()!!});
    biigle.$declare('sync.labelCandidates', {!!$labelCandidates->toJson()!!});
    biigle.$declare('sync.conflictingParents', {!!$conflictingParents->toJson()!!});
    biigle.$declare('sync.userCandidates', {!!$userCandidates->toJson()!!});
    biigle.$declare('sync.adminRoleId', {!!$adminRoleId!!});
</script>
<script src="{{ cachebust_asset('vendor/sync/scripts/main.js') }}"></script>
@endpush


@section('admin-content')
<div class="row">
    <h2>Label Tree Import</h2>
    @if ($importLabelTreesCount === 0)
        <div class="panel panel-info">
            <div class="panel-body text-info">
                The import archive appears to contain no label trees.
            </div>
        </div>
        <form method="post" action="{{url('api/v1/import/'.$token)}}">
            <input type="hidden" name="_method" value="DELETE">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <button class="btn btn-success pull-right" title="Delete the uploaded import files">Okay</button>
        </form>
    @elseif ($labelTreeCandidatesCount === 0 && $labelCandidatesCount === 0)
        <div class="panel panel-info">
            <div class="panel-body text-info">
                All of the label trees and labels that should be imported already exist.
            </div>
        </div>
        <form method="post" action="{{url('api/v1/import/'.$token)}}">
            <input type="hidden" name="_method" value="DELETE">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <button class="btn btn-success pull-right" title="Delete the uploaded import files">Okay</button>
        </form>
    @else
        @if ($excludedLabelTreeCandidatesCount > 0)
            <div class="panel panel-info">
                <div class="panel-body text-info">
                    {{$excludedLabelTreeCandidatesCount}} of the {{$importLabelTreesCount}} label trees that should be imported already exist(s).
                </div>
            </div>
        @endif
        <div id="label-tree-import-container">
            @if ($labelTreeCandidatesCount > 0)
                <h3>Select label trees to import</h3>
                <entity-chooser v-bind:entities="labelTreeCandidates" v-on:select="handleChosenLabelTrees"></entity-chooser>

                <div v-if="hasChosenUsers" class="panel panel-info" v-cloak>
                    <div class="panel-body text-info">
                        These users will be imported because they are label tree admins:
                    </div>
                    <ul class="list-group">
                        <li v-for="user in chosenUsers" class="list-group-item">
                            <span v-text="user.name"></span> <span class="text-muted">(<span v-text="user.email"></span>)</span>
                        </li>
                    </table>
                </div>
            @endif

            @if ($labelCandidatesCount > 0)
                <h3>Select labels to import</h3>
                <p>
                    These labels can be merged into already existing label trees.
                </p>
                <entity-chooser v-bind:entities="labels" v-on:select="handleChosenLabels"></entity-chooser>

                <div v-if="hasConflictingLabels" v-cloak class="panel panel-default" v-bind:class="panelClass">
                    <div class="panel-body" v-bind:class="panelBodyClass">
                        The following labels are in conflict with existing labels. Choose what information should be retained during the import by selecting it.
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th class="choosable-information" title="Choose import information for all labels" v-on:click="chooseAllImportInformation">Import label information</th>
                                <th class="choosable-information" title="Choose existing information for all labels" v-on:click="chooseAllExistingInformation">Existing label information</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="label in conflictingLabels">
                                <td>
                                    <span v-if="hasLabelConflictingName(label)" class="choosable-information" title="Choose the import name for this label" v-on:click="chooseImportName(label)" v-bind:class="{chosen: label.conflicting_name_resolution === 'import'}">
                                        Name: <span v-text="label.name"></span>
                                    </span>
                                    <span v-else class="text-muted" v-text="label.name"></span><br>
                                    <span v-if="hasLabelConflictingParent(label)" class="choosable-information" title="Choose the import parent for this label" v-on:click="chooseImportParent(label)" v-bind:class="{chosen: label.conflicting_parent_resolution === 'import'}">
                                        Parent: <span v-if="label.parent" v-text="label.parent.name"></span><span v-else class="text-muted">None</span>
                                    </span>
                                </td>
                                <td>
                                    <span v-if="hasLabelConflictingName(label)" class="choosable-information" title="Choose the existing name for this label" v-on:click="chooseExistingName(label)" v-bind:class="{chosen: label.conflicting_name_resolution === 'existing'}">
                                        Name: <span v-text="label.conflicting_name"></span>
                                    </span><br>
                                    <span v-if="hasLabelConflictingParent(label)" class="choosable-information" title="Choose the existing parent for this label" v-on:click="chooseExistingParent(label)" v-bind:class="{chosen: label.conflicting_parent_resolution === 'existing'}">
                                        Parent: <span v-if="label.conflicting_parent" v-text="label.conflicting_parent.name"></span><span v-else class="text-muted">None</span>
                                    </span>
                                </td>
                                <td>
                                    <i v-if="isLabelConflictResolved(label)" class="fa fa-check text-success" title="Conflict resolved"></i>
                                    <i v-else class="fa fa-times text-danger" title="Unresolved conflict"></i>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            @endif

            <div v-if="success" v-cloak class="alert alert-success">
                The import was successful. You can now request a new import.
            </div>
            <div v-else class="pull-right">
                <form method="post" action="{{url('api/v1/import/'.$token)}}">
                    <input type="hidden" name="_method" value="DELETE">
                    <input type="hidden" name="_token" value="{{ csrf_token() }}">
                    <div class="form-group">
                        <button type="submit" class="btn btn-default" title="Delete the uploaded import files">Discard import</button>
                        <button type="button" class="btn btn-success" v-on:click.prevent="performImport" v-bind:disabled="loading || hasNoChosenItems || hasUnresolvedConflicts" v-bind:title="submitTitle">Perform import</button>
                    </div>
                </form>
            </div>
        </div>
    @endif
</div>
@endsection
