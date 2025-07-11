@extends('app')

@section('title', 'Start creating a new volume')

@push('scripts')
   <script type="module">
      biigle.$declare('volumes.mediaType', '{!! $mediaType !!}');
      biigle.$declare('volumes.parsers', {!! $parsers !!});
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
                Select annotation tools <span class="text-muted">(optional)</span>
            </legend>
            <div class="form-group">
                <p class="text-muted">
                    Choose which annotation tools should be available when annotating this volume. If none are selected, all tools will be available.
                </p>
                
                <div class="annotation-tools-selector">
                    <div class="btn-group drawing-controls">
                        <!-- Point tool -->
                        <div class="checkbox-control-button">
                            <input type="checkbox" name="annotation_tools[]" id="create-tool-point" value="point" v-model="selectedAnnotationTools">
                            <label for="create-tool-point" class="control-button" title="Draw a point">
                                <i class="icon icon-white icon-point"></i>
                            </label>
                        </div>
                        
                        <!-- Rectangle tool -->
                        <div class="checkbox-control-button">
                            <input type="checkbox" name="annotation_tools[]" id="create-tool-rectangle" value="rectangle" v-model="selectedAnnotationTools">
                            <label for="create-tool-rectangle" class="control-button" title="Draw a rectangle">
                                <i class="icon icon-white icon-rectangle"></i>
                            </label>
                        </div>
                        
                        <!-- Circle with Ellipse sub-control -->
                        <div class="checkbox-control-button control-button-with-sub">
                            <input type="checkbox" name="annotation_tools[]" id="create-tool-circle" value="circle" v-model="selectedAnnotationTools">
                            <label for="create-tool-circle" class="control-button" title="Draw a circle">
                                <i class="icon icon-white icon-circle"></i>
                            </label>
                            <div class="control-button__sub-controls btn-group">
                                <div class="checkbox-control-button">
                                    <input type="checkbox" name="annotation_tools[]" id="create-tool-ellipse" value="ellipse" v-model="selectedAnnotationTools">
                                    <label for="create-tool-ellipse" class="control-button" title="Draw an ellipse">
                                        <i class="icon icon-white icon-ellipse"></i>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <!-- LineString with Measure sub-controls -->
                        <div class="checkbox-control-button control-button-with-sub">
                            <input type="checkbox" name="annotation_tools[]" id="create-tool-linestring" value="linestring" v-model="selectedAnnotationTools">
                            <label for="create-tool-linestring" class="control-button" title="Draw a line string">
                                <i class="icon icon-white icon-linestring"></i>
                            </label>
                            <div class="control-button__sub-controls btn-group">
                                <div class="checkbox-control-button">
                                    <input type="checkbox" name="annotation_tools[]" id="create-tool-measure" value="measure" v-model="selectedAnnotationTools">
                                    <label for="create-tool-measure" class="control-button" title="Measure a line string">
                                        <i class="fa fa-ruler"></i>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Polygon with all sub-tools -->
                        <div class="checkbox-control-button control-button-with-sub">
                            <input type="checkbox" name="annotation_tools[]" id="create-tool-polygon" value="polygon" v-model="selectedAnnotationTools">
                            <label for="create-tool-polygon" class="control-button" title="Draw a polygon">
                                <i class="icon icon-white icon-polygon"></i>
                            </label>
                            <div class="control-button__sub-controls btn-group">
                                <div class="checkbox-control-button">
                                    <input type="checkbox" name="annotation_tools[]" id="create-tool-polygonbrush" value="polygonbrush" v-model="selectedAnnotationTools">
                                    <label for="create-tool-polygonbrush" class="control-button" title="Draw a polygon using the brush tool">
                                        <i class="fa fa-paint-brush"></i>
                                    </label>
                                </div>
                                <div class="checkbox-control-button">
                                    <input type="checkbox" name="annotation_tools[]" id="create-tool-polygonEraser" value="polygonEraser" v-model="selectedAnnotationTools">
                                    <label for="create-tool-polygonEraser" class="control-button" title="Modify selected polygons using the eraser tool">
                                        <i class="fa fa-eraser"></i>
                                    </label>
                                </div>
                                <div class="checkbox-control-button">
                                    <input type="checkbox" name="annotation_tools[]" id="create-tool-polygonFill" value="polygonFill" v-model="selectedAnnotationTools">
                                    <label for="create-tool-polygonFill" class="control-button" title="Modify selected polygons using the fill tool">
                                        <i class="fa fa-fill-drip"></i>
                                    </label>
                                </div>
                                <div class="checkbox-control-button">
                                    <input type="checkbox" name="annotation_tools[]" id="create-tool-magicwand" value="magicwand" v-model="selectedAnnotationTools">
                                    <label for="create-tool-magicwand" class="control-button" title="Draw a polygon using the magic wand tool">
                                        <i class="fa fa-magic"></i>
                                    </label>
                                </div>
                                <div class="checkbox-control-button">
                                    <input type="checkbox" name="annotation_tools[]" id="create-tool-magicsam" value="magicsam" v-model="selectedAnnotationTools">
                                    <label for="create-tool-magicsam" class="control-button" title="Draw a polygon using the magic sam tool">
                                        <i class="fa fa-hat-wizard"></i>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="text-right" style="margin-top: 15px;">
                    <button type="button" class="btn btn-default btn-sm" v-on:click="toggleAllAnnotationTools" :title="allToolsSelectedText">
                        <i :class="toggleAllToolsIcon"></i>
                    </button>
                </div>
            </div>
        </fieldset>
        <fieldset>
            <legend>
                Select a metadata file <span class="text-muted">(optional)</span>
            </legend>
            <div class="form-group{{ $errors->hasAny(['metadata_file', 'metadata_parser']) ? ' has-error' : '' }}">
                <p class="text-center">
                    <dropdown tag="span">
                        <button class="btn btn-default btn-lg dropdown-toggle" :class="fileButtonClass" type="button"><i class="fa fa-file-alt"></i> Select a file <span class="caret"></span></button>
                        <template #dropdown>
                            <li v-for="parser in availableParsers">
                                <a href="#" v-on:click.prevent="selectFile(parser)" v-text="parser.name"></a>
                            </li>
                        </template>
                    </dropdown>
                </p>
                <input class="hidden" name="metadata_file" type="file" ref="metadataFileField" v-on:change="handleSelectedFile" :accept="selectedParser?.mimeTypes">
                <input v-if="hasFile" type="hidden" name="metadata_parser" :value="selectedParser?.parserClass">

                @if ($errors->has('metadata_file'))
                   <p class="help-block">{{ $errors->first('metadata_file') }}</p>
                @endif

                @if ($errors->has('metadata_parser'))
                   <p class="help-block">{{ $errors->first('metadata_parser') }}</p>
                @endif
                <p class="help-block">
                    By default, BIIGLE supports a CSV metadata format. Other supported formats may be listed in <a href="{{route('manual-tutorials', ['volumes', 'file-metadata'])}}" target="_blank">the manual</a>. Image metadata may be overridden by EXIF information during the creation of the volume.
                </p>
            </div>
        </fieldset>
        <div class="form-group">
             <input type="hidden" name="_token" value="{{ csrf_token() }}">
             <a href="{{ route('project', $project->id) }}" class="btn btn-default" :disabled="loading || null">Cancel</a>
             <input type="submit" class="btn btn-success pull-right" value="Continue" :disabled="loading || null" title="Proceed to enter the volume details">
         </div>
      </form>
    </div>
</div>
@endsection
