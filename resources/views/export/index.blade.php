@extends('admin.base')

@section('title', 'Export')

@push('scripts')
<script type="module">
    biigle.$declare('sync.mediaTypes', {!! $mediaTypes !!});
    biigle.$declare('sync.allowedExports', {!!json_encode($allowedExports)!!});
</script>
@endpush

@section('admin-content')
<div id="export-container">
    <tabs v-on:change="handleSwitchedTab">
        @if (in_array('volumes', $allowedExports))
            <tab title="Volumes" v-cloak>
                {{-- Implement: Woah, these are a lot of annotations you want to export. Consider splitting the export into multiple files or BIIGLE might not be able to process it fast enough. --}}
                <p>
                    Select volumes to export:
                </p>
                <entity-chooser v-bind:entities="volumes" v-on:select="handleChosenVolumes"></entity-chooser>
                <div class="panel panel-info">
                    <div class="panel-body text-info text-center">
                        Export files do not contain user passwords. Imported users have to reset their password.
                    </div>
                </div>
                <div class="form-group">
                    <label for="volume-export-description">Description (optional)</label>
                    <input id="volume-export-description" type="text" class="form-control" maxlength="255" v-model="descriptions.volumes">
                </div>
                <button type="button" class="btn btn-success pull-right" v-on:click.prevent="requestVolumeExport" v-bind:disabled="(loading || hasNoChosenVolumes) || null">Request volume export</button>
            </tab>
        @endif
        @if (in_array('labelTrees', $allowedExports))
            <tab title="Label Trees" v-cloak>
                <p>
                    Select label trees to export:
                </p>
                <entity-chooser v-bind:entities="labelTrees" v-on:select="handleChosenLabelTrees"></entity-chooser>
                <div class="panel panel-info">
                    <div class="panel-body text-info text-center">
                        Export files do not contain user passwords. Imported users have to reset their password.
                    </div>
                </div>
                <div class="form-group">
                    <label for="label-tree-export-description">Description (optional)</label>
                    <input id="label-tree-export-description" type="text" class="form-control" maxlength="255" v-model="descriptions.labelTrees">
                </div>
                <button type="button" class="btn btn-success pull-right" v-on:click.prevent="requestLabelTreeExport" v-bind:disabled="(loading || hasNoChosenLabelTrees) || null">Request label tree export</button>
            </tab>
        @endif
        @if (in_array('users', $allowedExports))
            <tab title="Users" v-cloak>
                <p>
                    Select users to export:
                </p>
                <entity-chooser v-bind:entities="users" v-on:select="handleChosenUsers"></entity-chooser>
                <div class="panel panel-info">
                    <div class="panel-body text-info text-center">
                        Export files do not contain user passwords. Imported users have to reset their password.
                    </div>
                </div>
                <div class="form-group">
                    <label for="user-export-description">Description (optional)</label>
                    <input id="user-export-description" type="text" class="form-control" maxlength="255" v-model="descriptions.users">
                </div>
                <button type="button" class="btn btn-success pull-right" v-on:click.prevent="requestUserExport" v-bind:disabled="(loading || hasNoChosenUsers) || null">Request user export</button>
            </tab>
        @endif
    </tabs>
</div>
@endsection
