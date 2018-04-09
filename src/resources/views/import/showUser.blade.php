@extends('admin.base')

@section('title', 'User Import')

@push('styles')
<link href="{{ cachebust_asset('vendor/sync/styles/main.css') }}" rel="stylesheet">
@endpush

@push('scripts')
<script type="text/javascript">
    biigle.$declare('sync.importToken', '{{$token}}');
    biigle.$declare('sync.importCandidates', {!!$importCandidates->toJson()!!});
</script>
<script src="{{ cachebust_asset('vendor/sync/scripts/main.js') }}"></script>
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
            <button class="btn btn-success pull-right">Okay</button>
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
            <button class="btn btn-success pull-right">Okay</button>
        </form>
    @else
        <div class="panel panel-info">
            <div class="panel-body text-info">
                {{$importUsersCount - $importCandidatesCount}} of the {{$importUsersCount}} users that should be imported already exist and are excluded from the import.
            </div>
        </div>
        <p>
            Select users to import:
        </p>
        <div id="user-import-container">
            <entity-chooser v-bind:entities="users" v-on:select="handleChosenUsers"></entity-chooser>
            <div v-if="success" v-cloak class="alert alert-success">
                The import was successful. You can now request a new import.
            </div>
            <button v-else class="btn btn-success pull-right" v-on:click="performImport" v-bind:disabled="loading || hasNoChosenUsers">Perform import</button>
        </div>
    @endif
</div>
@endsection
