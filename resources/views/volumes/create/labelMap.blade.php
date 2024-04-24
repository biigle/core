@extends('app')

@section('title', 'Select the metadata import label mapping')

@push('scripts')
    <script type="text/javascript">
        biigle.$declare('volumes.labelMap', {!! $labelMap !!});
        biigle.$declare('volumes.labels', {!! $labels !!});
        biigle.$declare('volumes.labelTrees', {!! $labelTrees !!});
    </script>
@endpush

@section('content')

<div class="container">
    <div id="create-volume-form-step-5" class="col-sm-10 col-sm-offset-1 col-lg-8 col-lg-offset-2">
        <h2>Metadata import label mapping</h2>
        <p class="text-muted">
            Each label from the metadata file must be mapped to a label in the BIIGLE database. Some labels can be mapped automatically. The rest must be mapped manually. You can also create new labels based on the metadata information.
        </p>
        <form role="form" method="POST" action="{{ url("api/v1/pending-volumes/{$pv->id}/label-map") }}" v-on:submit="startLoading">

            <div class="form-group{{ $errors->has('label_map') ? ' has-error' : '' }}">
                <input
                    v-for="label in mappedLabels"
                    type="hidden"
                    :name="'label_map[' + label.id + ']'"
                    :value="label.mappedLabel"
                    >
                @if ($errors->has('label_map'))
                   <span class="help-block">{{ $errors->first('label_map') }}</span>
                @endif
            </div>

            <label-mapping
                :from-labels="labels"
                :to-labels="flatLabels"
                :trees="flatTrees"
                :loading="loading"
                v-on:select="handleSelect"
                v-on:create="handleCreate"
                ></label-mapping>

            <div class="clearfix">
                <p v-if="!hasDanglingLabels" class="text-muted pull-right">
                    All labels are mapped.
                </p>
                <p v-cloak v-else class="text-muted pull-right">
                    <span v-text="danglingLabels.length"></span> labels must be mapped.
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
