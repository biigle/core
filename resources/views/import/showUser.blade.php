@extends('admin.base')

@section('title', 'User Import')

@push('scripts')
<script type="text/javascript">
    biigle.$declare('sync.importToken', '{{$token}}');
    biigle.$declare('sync.importCandidates', {!!$importCandidates->toJson()!!});
</script>
@endpush


@section('admin-content')
<div class="row">
    <h2>User Import</h2>
    @if ($importUsersCount === 0)
        <div class="panel panel-info">
            <div class="panel-body text-info">
                The import archive appears to contain no users.
            </div>
        </div>
        <form method="post" action="{{url('api/v1/import/'.$token)}}">
            <input type="hidden" name="_method" value="DELETE">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <button class="btn btn-success pull-right" title="Delete the uploaded import files">Okay</button>
        </form>
    @elseif ($importCandidatesCount === 0)
        <div class="panel panel-info">
            <div class="panel-body text-info">
                All of the {{$importUsersCount}} users that should be imported already exist.
            </div>
        </div>
        <form method="post" action="{{url('api/v1/import/'.$token)}}">
            <input type="hidden" name="_method" value="DELETE">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <button class="btn btn-success pull-right" title="Delete the uploaded import files">Okay</button>
        </form>
    @else
        @if ($excludedCandidatesCount > 0)
            <div class="panel panel-info">
                <div class="panel-body text-info">
                    {{$excludedCandidatesCount}} of the {{$importUsersCount}} users that should be imported already exist and are excluded from the import.
                </div>
            </div>
        @endif
        <p>
            Select users to import:
        </p>
        <div id="user-import-container">
            <entity-chooser v-bind:entities="users" v-bind:disabled="success" v-on:select="handleChosenUsers"></entity-chooser>
            <div v-if="success" v-cloak class="alert alert-success">
                The import was successful. You can now request a new import.
            </div>
            <div v-else class="pull-right">
                <form method="post" action="{{url('api/v1/import/'.$token)}}">
                    <input type="hidden" name="_method" value="DELETE">
                    <input type="hidden" name="_token" value="{{ csrf_token() }}">
                    <div class="form-group">
                        <loader v-bind:active="loading" v-cloak></loader>
                        <button type="submit" class="btn btn-default" title="Delete the uploaded import files" v-bind:disabled="loading">Discard import</button>
                        <button type="button" class="btn btn-success" v-on:click.prevent="performImport" v-bind:disabled="loading || hasNoChosenUsers">Perform import</button>
                    </div>
                </form>
            </div>
        </div>
    @endif
</div>
@endsection
