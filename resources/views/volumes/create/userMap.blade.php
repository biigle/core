@extends('app')

@section('title', 'Select the metadata import user mapping')

@push('scripts')
    <script type="text/javascript">
        biigle.$declare('volumes.userMap', {!! $userMap !!});
        biigle.$declare('volumes.users', {!! $users !!});
        biigle.$declare('volumes.ownUserId', {!! $user->id !!});
    </script>
@endpush

@section('content')

<div class="container">
    <div id="create-volume-form-step-6" class="col-sm-10 col-sm-offset-1 col-lg-8 col-lg-offset-2">
        <h2>Metadata import user mapping</h2>
        <p class="text-muted">
            Each user from the metadata file must be mapped to a user in the BIIGLE database. Some labels can be mapped automatically. The rest must be mapped manually.
        </p>
        <form role="form" method="POST" action="{{ url("api/v1/pending-volumes/{$pv->id}/user-map") }}" v-on:submit="startLoading">

            <div class="form-group{{ $errors->has('user_map') ? ' has-error' : '' }}">
                <input
                    v-for="user in mappedUsers"
                    type="hidden"
                    :name="'user_map[' + user.id + ']'"
                    :value="user.mappedUser"
                    >
                @if ($errors->has('user_map'))
                   <span class="help-block">{{ $errors->first('user_map') }}</span>
                @endif
            </div>

            <user-mapping
                :from-users="users"
                :to-users="allUsers"
                :loading="loading"
                v-on:select="handleSelect"
                v-on:select-self="handleSelectSelf"
                ></user-mapping>

            <div class="clearfix">
                <p v-if="!hasDanglingUsers" class="text-muted pull-right">
                    All users are mapped.
                </p>
                <p v-cloak v-else class="text-muted pull-right">
                    <span v-text="danglingUsers.length"></span> users must be mapped.
                </p>
            </div>

            <div class="form-group">
                <input type="hidden" name="_token" value="{{ csrf_token() }}">
                <input type="hidden" name="_method" value="PUT">
                <button type="submit" form="cancel-pending-volume" class="btn btn-default" :disabled="loading" title="Discard metadata and continue to the new volume" onclick="return confirm('Are you sure you want to abort the metadata import?')">Cancel</button>

                <span class="pull-right">
                    <loader :active="loading"></loader>
                    <input type="submit" class="btn btn-success" value="Continue" :disabled="cannotContinue">
                </span>
            </div>
        </form>
        <form id="cancel-pending-volume" method="POST" action="{{ url("api/v1/pending-volumes/{$pv->id}") }}" v-on:submit="startLoading">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <input type="hidden" name="_method" value="DELETE">
            <input type="hidden" name="_redirect" value="{{route('volume', $pv->volume_id)}}">
        </form>
    </div>
</div>
@endsection
