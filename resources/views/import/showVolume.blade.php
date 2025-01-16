@extends('admin.base')

@section('title', 'Volume Import')

@push('scripts')
<script type="module">
    biigle.$declare('sync.importToken', '{{$token}}');
    biigle.$declare('sync.volumeCandidates', {!!$volumeCandidates->toJson()!!});
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
    <h2>Volume Import</h2>
    @if ($volumeCandidates->count() === 0)
        <div class="panel panel-info">
            <div class="panel-body text-info">
                The import archive appears to contain no volumes.
            </div>
        </div>
        <form method="post" action="{{url('api/v1/import/'.$token)}}">
            <input type="hidden" name="_method" value="DELETE">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <button class="btn btn-success pull-right" title="Delete the uploaded import files">Okay</button>
        </form>
    @else
        <div id="volume-import-container">
            <h3>Select volumes to import</h3>
            <entity-chooser v-bind:entities="volumes" v-bind:disabled="success" v-on:select="handleChosenVolumes"></entity-chooser>

            <div v-if="hasChosenUsers" class="panel panel-info" v-cloak>
                <div class="panel-body text-info">
                    These additional users will be imported:
                </div>
                <ul class="list-group">
                    <li v-for="user in chosenUsers" class="list-group-item">
                        <span v-text="user.name"></span> <span class="text-muted">(<span v-text="user.email"></span>)</span>
                    </li>
                </table>
            </div>

            <div v-if="hasChosenLabelTrees" class="panel panel-info" v-cloak>
                <div class="panel-body text-info">
                    These additional label trees will be imported:
                </div>
                <ul class="list-group">
                    <li v-for="tree in chosenLabelTrees" class="list-group-item">
                        <span v-text="tree.name"></span>
                    </li>
                </table>
            </div>

            <div v-if="hasChosenLabelTreeAdmins" class="panel panel-info" v-cloak>
                <div class="panel-body text-info">
                    These additional users will be imported because they are label tree admins:
                </div>
                <ul class="list-group">
                    <li v-for="user in chosenLabelTreeAdmins" class="list-group-item">
                        <span v-text="user.name"></span> <span class="text-muted">(<span v-text="user.email"></span>)</span>
                    </li>
                </table>
            </div>

            <div v-if="hasChosenLabels" class="panel panel-info" v-cloak>
                <div class="panel-body text-info">
                    These additional labels will be imported:
                </div>
                <ul class="list-group">
                    <li v-for="label in chosenLabels" class="list-group-item">
                        <span v-text="label.name"></span>
                    </li>
                </table>
            </div>
            @include('import.labelConflictsPanel')

            <div v-if="!hasNoChosenItems" v-cloak>
                <h3>Update volume URLs</h3>
                <p>
                    If the images of the selected volumes are stored at a new location, you can update the volume URLs here.
                </p>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Volume</th>
                            <th>New URL</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="volume in chosenVolumes">
                            <td v-text="volume.name"></td>
                            <td><input type="text" name="url" class="form-control" v-model="volume.new_url"></td>
                        </tr>
                    </tbody>
                </table>

                <h3>Select a target project</h3>
                <p>
                    The selected volumes will be attached to this project during import.
                </p>
                <typeahead class="typeahead--block" v-bind:items="availableProjects" placeholder="Project name" title="Select a target project" v-on:select="selectTargetProject" v-bind:clear-on-select="true" more-info="description"></typeahead>
                <div v-if="targetProject" class="panel panel-info" v-cloak>
                    <div class="panel-body text-info">
                        Target project: <strong v-text="targetProject.name"></strong>
                    </div>
                </div>
            </div>

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
                        <button type="button" class="btn btn-success" v-on:click.prevent="performImport" v-bind:disabled="cantDoImport" v-bind:title="submitTitle">Perform import</button>
                    </div>
                </form>
            </div>
        </div>
    @endif
</div>
@endsection
