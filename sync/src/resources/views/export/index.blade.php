@extends('admin.base')

@section('title', 'Export')

@push('styles')
<link href="{{ cachebust_asset('vendor/sync/styles/main.css') }}" rel="stylesheet">
@endpush

@push('scripts')
<script type="text/javascript">
    biigle.$declare('sync.mediaTypes', {!! $mediaTypes !!});
    biigle.$declare('sync.exportApiUrl', '{{url('api/v1/export')}}');
    biigle.$declare('sync.allowedExports', {!!json_encode($allowedExports)!!});
</script>
<script src="{{ cachebust_asset('vendor/sync/scripts/main.js') }}"></script>
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
                <div class="panel panel-warning">
                    <div class="panel-body text-warning text-center">
                        An export file contains user password hashes. Make sure no third party can read it!
                    </div>
                </div>
                <a v-bind:href="volumeRequestUrl" class="btn btn-success pull-right" v-bind:disabled="hasNoChosenVolumes">Request volume export</a>
            </tab>
        @endif
        @if (in_array('labelTrees', $allowedExports))
            <tab title="Label Trees" v-cloak>
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
        @endif
        @if (in_array('users', $allowedExports))
            <tab title="Users" v-cloak>
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
        @endif
    </tabs>
</div>
@endsection
