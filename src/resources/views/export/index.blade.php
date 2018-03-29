@extends('admin.base')

@section('title', 'Export')

@push('styles')
<link href="{{ cachebust_asset('vendor/sync/styles/main.css') }}" rel="stylesheet">
@endpush

@push('scripts')
<script type="text/javascript">
    biigle.$declare('sync.exportApiUrl', '{{url('api/v1/export')}}');
</script>
<script src="{{ cachebust_asset('vendor/sync/scripts/main.js') }}"></script>
<script type="text/x-template" id="entity-chooser-list-template">
    <div class="entity-chooser-list">
        <input type="text" class="form-control entity-chooser-list-search" placeholder="Filter..." v-model="filterQuery" v-if="filtering">
        <ul>
            <li v-for="e in entities" v-on:click="select(e)">
                <span v-text="e.name"></span><span v-if="true"><br><span class="text-muted" v-text="e.description"></span></span>
            </li>
        </ul>
    </div>
</script>
<script type="text/x-template" id="entity-chooser-template">
    <div class="entity-chooser">
        <entity-chooser-list class="entity-chooser-list--left" v-bind:entities="unchosenFilteredEntities" v-on:select="handleSelect" v-on:filter="handleFiltering" v-bind:filtering="true"></entity-chooser-list>
        <div class="entity-chooser-buttons">
            <button class="btn btn-default btn-block" v-on:click="chooseAll" v-bind:disabled="hasNoUnchosenEntities" title="Select all">all</button>
            <button class="btn btn-default btn-block" v-on:click="chooseNone" v-bind:disabled="hasNoChosenEntities" title="Select none">none</button>
        </div>
        <entity-chooser-list class="entity-chooser-list--right" v-bind:entities="chosenEntities" v-on:select="handleDeselect"></entity-chooser-list>
    </div>
</script>
@endpush

@section('admin-content')
<div id="export-container">
    <tabs v-on:active="handleSwitchedTab">
        <tab header="Volumes" v-cloak>
            {{-- Woah, these are a lot of annotations you want to export. Consider splitting the export into multiple files or BIIGLE might not be able to process it fast enough. --}}
            <p>
                Select volumes to export:
            </p>
            <entity-chooser v-bind:entities="volumes" v-on:select="handleChosenVolumes"></entity-chooser>
            <div class="panel panel-warning">
                <div class="panel-body text-warning text-center">
                    An export file contains user password hashes. Make sure no third party can read it!
                </div>
            </div>
            <a v-bind:href="volumeRequestUrl" class="btn btn-success pull-right" v-bind:disabled="hasNoChosenVolumes">Request volume export</a>
        </tab>
        <tab header="Label Trees" v-cloak>
            <p>
                Select label trees to export:
            </p>
            <entity-chooser v-bind:entities="labelTrees" v-on:select="handleChosenLabelTrees"></entity-chooser>
            <div class="panel panel-warning">
                <div class="panel-body text-warning text-center">
                    An export file contains user password hashes. Make sure no third party can read it!
                </div>
            </div>
            <a v-bind:href="labelTreeRequestUrl" class="btn btn-success pull-right" v-bind:disabled="hasNoChosenLabelTrees">Request label tree export</a>
        </tab>
        <tab header="Users" v-cloak>
            <p>
                Select users to export:
            </p>
            <entity-chooser v-bind:entities="users" v-on:select="handleChosenUsers"></entity-chooser>
            <div class="panel panel-warning">
                <div class="panel-body text-warning text-center">
                    An export file contains user password hashes. Make sure no third party can read it!
                </div>
            </div>
            <a v-bind:href="userRequestUrl" class="btn btn-success pull-right" v-bind:disabled="hasNoChosenUsers">Request user export</a>
        </tab>
    </tabs>
</div>
@endsection
