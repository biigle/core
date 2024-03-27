@extends('app')

@section('title', 'Select metadata anntation labels to import')

@push('scripts')
    <script type="text/javascript">
        biigle.$declare('volumes.labels', {!! $labels !!});
    </script>
@endpush

@section('content')

<div class="container">
    <div id="create-volume-form-step-3" class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
        <h2>Choose labels to filter metadata annotations</h2>
        <p class="text-muted">
            If you wish to import only annotations with certain labels from the metadata file, you can choose these labels here. By default, all labels are selected. With <kbd>Alt</kbd>+click you can select and deselect all labels.
        </p>
        <form role="form" method="POST" action="{{ url("api/v1/pending-volumes/{$pv->id}/annotation-labels") }}" v-on:submit="startLoading">

        <div class="well well-sm">
            <label-trees :trees="labelTrees" :multiselect="true" :allow-select-siblings="true" :collapsible="false"></label-trees>
        </div>

        <div class="form-group{{ $errors->has('labels') ? ' has-error' : '' }}">
            <div v-if="!allSelected">
                <input v-for="label in selectedLabels" type="hidden" name="labels[]" :value="label.id">
            </div>
            @if ($errors->has('labels'))
               <span class="help-block">{{ $errors->first('labels') }}</span>
            @endif
        </div>


        <div class="clearfix">
            <p v-if="allSelected" class="text-muted pull-right">
                All labels are selected.
            </p>
            <p v-cloak v-else class="text-muted pull-right">
                <span v-text="selectedLabels.length"></span> labels are selected.
            </p>
        </div>

        <div class="form-group">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <input type="hidden" name="_method" value="PUT">
            <button type="submit" form="cancel-pending-volume" class="btn btn-default" :disabled="loading" title="Discard metadata and continue to the new volume" onclick="return confirm('Are you sure you want to abort the metadata import?')">Cancel</button>

            <!-- continue to either the file label selection or the label map view -->
            <a v-if="allSelected" @if ($pv->import_file_labels) href="" @else href="" @endif class="btn btn-success pull-right">Continue</a>
             <input v-cloak v-else type="submit" class="btn btn-success pull-right" value="Continue" :disabled="cannotContinue" title="">
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
