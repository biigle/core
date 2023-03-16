@extends('app')

@section('title', 'clone volume')

@push('scripts')
    <script type="text/javascript">
        biigle.$declare('destinationProjects', {!!$destinationProjects!!});
        biigle.$declare('volume', {!!$volume!!});
        biigle.$declare('name', '{!!old('name',$volume->name)!!}');
        biigle.$declare('fileLabelTrees', {!!$labelTrees!!});
        biigle.$declare('selectedFilesIds', {!! collect(old('only_files',[])) !!});
        biigle.$declare('selectedFiles', {!! collect(old('selected_files',[])) !!});
        biigle.$declare('fileLabelIds', {!! collect(old('only_file_labels',[])) !!});
        biigle.$declare('annotationLabelTrees', {!!$labelTrees!!});
        biigle.$declare('cloneFileLabels', {{old('clone_file_labels',false)}});
        biigle.$declare('cloneAnnotations', {{old('clone_annotations',false)}});
        biigle.$declare('annotationLabelIds', {!! collect(old('only_annotation_labels', [])) !!});
        biigle.$declare('cloneUrlTemplate', "{{ url("api/v1/volumes/{$volume->id}/clone-to/:pid") }}")
    </script>
@endpush

@section('content')
    <div class="container">
        <div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
            <div class="form-group">
                <h2 class="row">Clone volume "{{$volume->name}}"</h2>
                <br>
            </div>
            <form id="clone-volume-form" class="clearfix" role="form" method="POST" :action="getCloneUrl"
                  enctype="multipart/form-data" v-on:submit="startLoading">
                <div class="row">
                    <div class="form-group">
                        <label>New volume name</label>
                        <input type="text" class="form-control" name="name" id="name" v-model="name"
                               placeholder="My new volume name" ref="nameInput" value="{{old('name')}}" required
                               autofocus minlength="1" maxlength="512">
                    </div>
                    <div class="form-group{{ $errors->has('name') ? ' has-error' : '' }}">
                        @if($errors->has('name'))
                            <span class="help-block">{{ $errors->first('name') }}</span>
                        @endif
                    </div>

                    <div class="form-group">
                        <label>New volume destination project</label>
                        <typeahead class="typeahead--block" :items="getProjects"
                                   placeholder="Select destination project"
                                   title="Select project to clone volume to"
                                   v-on:select="setProject" :clear-on-select="false"
                                   :value="setDefaultProject()" required></typeahead>
                    </div>

                    <div class="checkbox">
                        <label><input type="checkbox" id="files" v-model="cloneFiles">
                            Filter <span>
                            @if($volume->isImageVolume())
                                    images
                                @else
                                    videos
                                @endif
                            </span>
                        </label>
                    </div>
                    <div v-if="cloneFiles" v-cloak>
                        <div id="file-panel" class="panel panel-default volume-files-panel">
                            <div class="panel-heading">
                                <div class="form-group">
                                    <label>
                                        @if($volume->isImageVolume())
                                            Image(s):
                                        @else
                                            Video(s):
                                        @endif
                                    </label>
                                    @if ($volume->isImageVolume())
                                        <input type="text" class="form-control" id="files"
                                               placeholder="img*.jpg" v-model="filePattern" required
                                               v-on:keydown.enter="loadFilesMatchingPattern">
                                    @else
                                        <input type="text" class="form-control" id="files"
                                               placeholder="video*.mp4" v-model="filePattern" required
                                               v-on:keydown.enter="loadFilesMatchingPattern">
                                    @endif
                                </div>
                            </div>
                            <div class="panel-body">
                                <ul class="list-group files-list" v-cloak>
                                    <li v-for="file in selectedFiles" class="list-group-item"><span
                                            class="text-muted">#<span v-text="file.id"></span></span> <span
                                            v-text="file.filename"></span></li>
                                </ul>
                            </div>
                            <div class="form-group{{ $errors->has('clone_files') ? ' has-error' : '' }}">
                                @if($errors->has('clone_files'))
                                    <span class="help-block">{{ $errors->first('clone_files') }}</span>
                                @endif
                            </div>
                        </div>
                    </div>
                    <div>
                        <div class="checkbox">
                            <div v-cloak>
                                <label><input type="checkbox" class="checkbox" id="fileLabels"
                                              v-model="cloneFileLabels" name="cloneFileLabels" value="1">
                                    @if($volume->isImageVolume())
                                        Clone image labels
                                    @else
                                        Clone video labels
                                    @endif

                                </label>
                            </div>
                            <div class="form-group{{ $errors->has('clone_file_labels') ? ' has-error' : '' }}">
                                @if($errors->has('clone_file_labels'))
                                    <span class="help-block">{{ $errors->first('clone_file_labels') }}</span>
                                @endif
                            </div>

                            <div v-if="cloneFileLabels" v-cloak>
                                <label><input type="checkbox" class="checkbox" id="restrictFileLabels"
                                              v-model="restrictFileLabels">
                                    @if($volume->isImageVolume())
                                        Restrict image labels (<span v-text="selectedFileLabelsCount"></span> labels
                                        selected)
                                    @else
                                        Restrict video labels (<span v-text="selectedFileLabelsCount"></span> labels
                                        selected)
                                    @endif

                                </label>
                            </div>
                            <div class="form-group{{ $errors->has('only_file_labels') ? ' has-error' : '' }}">
                                @if($errors->has('only_file_labels'))
                                    <span class="help-block">{{ $errors->first('only_file_labels') }}</span>
                                @endif
                            </div>
                            <label-trees v-if="restrictFileLabels" :trees="fileLabelTrees" :multiselect="true"
                                         :allow-select-siblings="true" :allow-select-children="true"
                                         class="request-labels-well well well-sm"></label-trees>
                        </div>

                        <div class="checkbox">
                            <div v-cloak>
                                <label>
                                    <input type="checkbox" id="annotations" v-model="cloneAnnotationLabels"
                                           name="clone_annotations" value="1">
                                    Clone annotations</label>
                            </div>
                            <div class="form-group{{ $errors->has('clone_annotations') ? ' has-error' : '' }}">
                                @if($errors->has('clone_annotations'))
                                    <span class="help-block">{{ $errors->first('clone_annotations') }}</span>
                                @endif
                            </div>

                            <div v-if="cloneAnnotationLabels">
                                <div v-cloak>
                                    <label>
                                        <input type="checkbox" v-if="cloneAnnotationLabels" id="annotationLabel"
                                               v-model="restrictAnnotationLabels"> Restrict annotation labels (<span
                                            v-text="selectedAnnotationLabelsCount"></span> labels selected)
                                    </label>
                                </div>
                                <label-trees v-if="cloneAnnotationLabels && restrictAnnotationLabels"
                                             :trees="annotationLabelTrees"
                                             :multiselect="true"
                                             :allow-select-siblings="true" :allow-select-children="true"
                                             class="request-labels-well well well-sm"></label-trees>
                            </div>
                            <div class="form-group{{ $errors->has('only_annotation_labels') ? ' has-error' : '' }}">
                                @if($errors->has('only_annotation_labels'))
                                    <span class="help-block">{{ $errors->first('only_annotation_labels') }}</span>
                                @endif
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <span class="pull-right">
                        <a class="btn btn-default" :disabled="loading" type="button"
                           href="{{URL::previous()}}">Cancel</a>
                    <input type="submit" class="btn btn-success" :disabled="cannotSubmit" value="Clone">
                    </span>
                    <input v-if="restrictAnnotationLabels" v-for="id in annotationLabelIds" type="hidden"
                           name="only_annotation_labels[]"
                           v-bind:value="id">
                    <input v-if="restrictFileLabels" v-for="id in fileLabelIds" type="hidden" name="only_file_labels[]"
                           v-bind:value="id">
                    <input v-if="cloneFiles" v-for="file in selectedFiles" type="hidden" name="only_files[]"
                           v-bind:value="file.id">
                    <input v-if="cloneFiles" v-for="file in selectedFiles" type="hidden" name="selected_files[]"
                           v-bind:value="file.filename">
                    <input type="hidden" name="_token" value="{{ csrf_token() }}">
                </div>
            </form>
        </div>
    </div>
@endsection
