@extends('app')

@section('title', 'Finish the metadata import')

@section('content')

<div class="container">
    <div id="create-volume-form-step-7" class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
        <h2>Finish metadata import</h2>

        <ul class="list-group">
            @if ($pv->import_annotations)
                @if (empty($pv->only_annotation_labels))
                    <li class="list-group-item">
                        All annotations will be imported
                        <span class="pull-right text-success"><i class="fa fa-check"></i></span>
                    </li>
                @else
                    <li class="list-group-item">
                        Annotations with selected labels will be imported
                        <span class="pull-right text-success"><i class="fa fa-check"></i></span>
                    </li>
                @endif
            @endif
            @if ($pv->import_file_labels)
                @if (empty($pv->only_file_labels))
                    <li class="list-group-item">
                        All file labels will be imported
                        <span class="pull-right text-success"><i class="fa fa-check"></i></span>
                    </li>
                @else
                    <li class="list-group-item">
                        Selected file labels will be imported
                        <span class="pull-right text-success"><i class="fa fa-check"></i></span>
                    </li>
                @endif
            @endif
            @if ($labelMapOk)
                <li class="list-group-item">
                    All labels are mapped
                    <span class="pull-right text-success"><i class="fa fa-check"></i></span>
                </li>
            @else
                <li class="list-group-item text-danger">
                    Labels are not mapped
                    <span class="pull-right"><i class="fa fa-times"></i></span>
                </li>
            @endif
            @if ($userMapOk)
                <li class="list-group-item">
                    All users are mapped
                    <span class="pull-right text-success"><i class="fa fa-check"></i></span>
                </li>
            @else
                <li class="list-group-item text-danger">
                    Users are not mapped
                    <span class="pull-right"><i class="fa fa-times"></i></span>
                </li>
            @endif
        </ul>

        @if (!$labelMapOk)
            <a href="{{route('pending-volume-label-map', $pv->id)}}" class="btn btn-warning pull-right">Back to label mapping</a>

            <button type="submit" form="cancel-pending-volume" class="btn btn-default" :disabled="loading" title="Discard metadata and continue to the new volume" onclick="return confirm('Are you sure you want to abort the metadata import?')">Cancel</button>
        @elseif (!$userMapOk)
            <a href="{{route('pending-volume-user-map', $pv->id)}}" class="btn btn-warning pull-right">Back to user mapping</a>

            <button type="submit" form="cancel-pending-volume" class="btn btn-default" :disabled="loading" title="Discard metadata and continue to the new volume" onclick="return confirm('Are you sure you want to abort the metadata import?')">Cancel</button>
        @else
            <form role="form" method="POST" action="{{ url("api/v1/pending-volumes/{$pv->id}/import") }}" v-on:submit="startLoading">
                <div class="form-group{{ $errors->has('id') ? ' has-error' : '' }}">
                    @if ($errors->has('id'))
                       <span class="help-block">{{ $errors->first('id') }}</span>
                    @endif
                    <input type="hidden" name="_token" value="{{ csrf_token() }}">
                    <button type="submit" form="cancel-pending-volume" class="btn btn-default" :disabled="loading" title="Discard metadata and continue to the new volume" onclick="return confirm('Are you sure you want to abort the metadata import?')">Cancel</button>

                    <input type="submit" class="btn btn-success pull-right" value="Finish import" :disabled="loading">
                </div>
            </form>
        @endif
        <form id="cancel-pending-volume" method="POST" action="{{ url("api/v1/pending-volumes/{$pv->id}") }}" v-on:submit="startLoading">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <input type="hidden" name="_method" value="DELETE">
            <input type="hidden" name="_redirect" value="{{route('volume', $pv->volume_id)}}">
        </form>
    </div>
</div>
@endsection
