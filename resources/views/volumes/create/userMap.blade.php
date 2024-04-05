@extends('app')

@section('title', 'Select the metadata import user mapping')

@push('scripts')
    <script type="text/javascript">
        {{-- biigle.$declare('volumes.labels', {!! $labels !!}); --}}
    </script>
@endpush

@section('content')

<div class="container">
    <div id="create-volume-form-step-5" class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
        <h2>Metadata import user mapping</h2>
        <p class="text-muted">
            TODO
        </p>
        <form role="form" method="POST" action="{{ url("api/v1/pending-volumes/{$pv->id}/user-map") }}" v-on:submit="startLoading">

            <div class="form-group{{ $errors->has('user_map') ? ' has-error' : '' }}">
                {{--<input v-for="label in selectedLabels" type="hidden" name="user_map[]" :value="label.id">--}}
                @if ($errors->has('user_map'))
                   <span class="help-block">{{ $errors->first('user_map') }}</span>
                @endif
            </div>

            <div class="clearfix">
                <p v-if="allMapped" class="text-muted pull-right">
                    All users are mapped.
                </p>
                <p v-cloak v-else class="text-muted pull-right">
                    <span v-text="danglingLabels.length"></span> users must be mapped.
                </p>
            </div>

            <div class="form-group">
                <input type="hidden" name="_token" value="{{ csrf_token() }}">
                <input type="hidden" name="_method" value="PUT">
                <button type="submit" form="cancel-pending-volume" class="btn btn-default" :disabled="loading" title="Discard metadata and continue to the new volume" onclick="return confirm('Are you sure you want to abort the metadata import?')">Cancel</button>

                <input type="submit" class="btn btn-success pull-right" value="Continue" :disabled="cannotContinue">
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
