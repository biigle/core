@extends('app')

@section('title', 'Start creating a new volume')

@push('scripts')
   <script type="text/javascript">
      biigle.$declare('volumes.mediaType', '{!! $mediaType !!}');
   </script>
@endpush

@section('content')

<div class="container">
    <div id="create-volume-form-step-1" class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
        <h2>New volume for {{ $project->name }}</h2>
        <form role="form" method="POST" action="{{ url("api/v1/projects/{$project->id}/pending-volumes") }}" enctype="multipart/form-data" v-on:submit="startLoading">
        <fieldset>
            <legend>
                Choose a media type
            </legend>
            <div class="form-group {{ $errors->has('media_type') ? ' has-error' : '' }}">
                <div class="btn-group btn-group-justified">
                    <div class="btn-group">
                        <button v-if="!initialized" type="button" class="btn btn-info btn-lg active"><i class="fa fa-image"></i> Image Volume</button>
                        <button v-cloak type="button" class="btn btn-default btn-lg" v-on:click="selectImageMediaType" :class="imageTypeButtonClass" ref="imageTypeButton"><i class="fa fa-image"></i> Image Volume</button>
                    </div>
                    <div class="btn-group">
                        <button type="button" class="btn btn-default btn-lg" v-on:click="selectVideoMediaType" :class="videoTypeButtonClass"><i class="fa fa-film"></i> Video Volume</button>
                    </div>
                </div>
                @if ($errors->has('media_type'))
                   <p class="help-block">{{ $errors->first('media_type') }}</p>
                @endif
                <p class="help-block">
                    The media type determines the type of files that can be included in the volume. Each type requires different annotation tools.
                </p>
                <input type="hidden" name="media_type" v-model="mediaType">
            </div>
        </fieldset>
        <fieldset>
            <legend>
                Select a metadata file <span class="text-muted">(optional)</span>
            </legend>
            <div class="form-group{{ $errors->has('metadata_file') ? ' has-error' : '' }}">
                <p class="text-center">
                    <button class="btn btn-default btn-lg" type="button" v-on:click="selectFile" :class="fileButtonClass"><i class="fa fa-file-alt"></i> Select a file</button>
                </p>
                <input class="hidden" name="metadata_file" type="file" ref="metadataFileField" v-on:change="handleSelectedFile" accept="{{implode(',', $mimeTypes)}}">
                @if ($errors->has('metadata_file'))
                   <p class="help-block">{{ $errors->first('metadata_file') }}</p>
                @endif
                <p class="help-block">
                    By default, BIIGLE supports a CSV metadata format. Other supported formats may be listed in <a href="{{route('manual-tutorials', ['volumes', 'file-metadata'])}}" target="_blank">the manual</a>. Image metadata may be overridden by EXIF information during the creation of the volume.
                </p>
            </div>
        </fieldset>
        <div class="form-group">
             <input type="hidden" name="_token" value="{{ csrf_token() }}">
             <a href="{{ route('project', $project->id) }}" class="btn btn-default" :disabled="loading">Cancel</a>
             <input type="submit" class="btn btn-success pull-right" value="Continue" :disabled="loading" title="Proceed to enter the volume details">
         </div>
      </form>
    </div>
</div>
@endsection
