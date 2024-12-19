@extends('admin.base')

@section('title', 'Label Tree Import')

@push('scripts')
<script type="text/javascript">
    biigle.$declare('sync.importToken', '{{$token}}');
    biigle.$declare('sync.labelTreeCandidates', {!!$labelTreeCandidates->toJson()!!});
    biigle.$declare('sync.importLabels', {!!$importLabels->toJson()!!});
    biigle.$declare('sync.labelCandidates', {!!$labelCandidates->toJson()!!});
    biigle.$declare('sync.conflictingParents', {!!$conflictingParents->toJson()!!});
    biigle.$declare('sync.userCandidates', {!!$userCandidates->toJson()!!});
    biigle.$declare('sync.adminRoleId', {!!$adminRoleId!!});
</script>
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
                <entity-chooser v-bind:entities="labelTreeCandidates" v-bind:disabled="success" v-on:select="handleChosenLabelTrees"></entity-chooser>

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
                <entity-chooser v-bind:entities="labels" v-bind:disabled="success" v-on:select="handleChosenLabels"></entity-chooser>
                @include('import.labelConflictsPanel')
            @endif

            <div v-if="success" v-cloak class="alert alert-success">
                The import was successful. You can now request a <a href="{{route('admin-import')}}">new import</a>.
            </div>
            <div v-else class="pull-right">
                <form method="post" action="{{url('api/v1/import/'.$token)}}">
                    <input type="hidden" name="_method" value="DELETE">
                    <input type="hidden" name="_token" value="{{ csrf_token() }}">
                    <div class="form-group">
                        <loader v-bind:active="loading" v-cloak></loader>
                        <button type="submit" class="btn btn-default" title="Delete the uploaded import files" v-bind:disabled="loading">Discard import</button>
                        <button type="button" class="btn btn-success" v-on:click.prevent="performImport" v-bind:disabled="loading || hasNoChosenItems || hasUnresolvedConflicts" v-bind:title="submitTitle">Perform import</button>
                    </div>
                </form>
            </div>
        </div>
    @endif
</div>
@endsection
