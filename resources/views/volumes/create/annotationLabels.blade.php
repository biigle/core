@extends('app')

@section('title', 'Select metadata anntation labels to import')

@push('scripts')
   <script type="text/javascript">

   </script>
@endpush

@section('content')

<div class="container">
    <div id="create-volume-form-step-3" class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
        <h2>Select labels to filter metadata annotations</h2>
        <form role="form" method="POST" action="{{ url("api/v1/pending-volumes/{$pv->id}/annotation-labels") }}" v-on:submit="startLoading">

        <div class="form-group">
             <input type="hidden" name="_token" value="{{ csrf_token() }}">
             <button type="submit" form="cancel-pending-volume" class="btn btn-default" :disabled="loading" title="Discard metadata and continue to the new volume">Cancel</button>
             <input type="submit" class="btn btn-success pull-right" value="Continue" :disabled="loading" title="Proceed to enter the volume details">
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
