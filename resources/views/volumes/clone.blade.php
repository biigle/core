@extends('app')

@section('title', 'clone volume')

@push('scripts')
    <script type="text/javascript">
        biigle.$declare('destinationProjects', {!!$destinationProjects!!});
        biigle.$declare('volume', {!!$volume!!});
        biigle.$declare('isImageVolume', {{$volume->isImageVolume()}});
        biigle.$declare('name', '{!!old('name',$volume->name)!!}');
        biigle.$declare('fileLabelTrees', {!!$labelTrees!!});
        biigle.$declare('selectedFilesIds', {!! collect(old('only_files',[])) !!});
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
                    <div class="form-group{{ $errors->has('name') ? ' has-error' : '' }}">
                        <label>New volume name</label>
                        <input type="text" class="form-control" name="name" id="name" v-model="name"
                               placeholder="My new volume name" ref="nameInput" value="{{old('name')}}" required
                               autofocus minlength="1" maxlength="512">
                        @if($errors->has('name'))
                            <span class="help-block">{{ $errors->first('name') }}</span>
                        @endif
                    </div>

                    <div class="form-group">
                        <label>New volume destination project</label>
                        <input class="form-control" type="text" name="" v-if="false">
                        <typeahead class="typeahead--block" :items="getProjects"
                                   placeholder="Select destination project"
                                   title="Select project to clone volume to"
                                   v-on:select="setProject" :clear-on-select="false"
                                   :value="selectedProjectName" required></typeahead>
                    </div>

                    <div class="{{ $errors->has('clone_files') ? ' has-error' : '' }}">
                        <div class="checkbox">
                            <label><input type="checkbox" id="files" v-model="filterFiles">
                                <span>Filter files</span>
                            </label>
                            @if($errors->has('clone_files'))
                                <span class="help-block">{{ $errors->first('clone_files') }}</span>
                            @else
                                <span class="help-block">Clone only a subset of the files</span>
                            @endif
                        </div>
                        <div v-if="filterFiles" class="form-group" v-cloak>
                            @if ($volume->isImageVolume())
                                <label>Image(s):</label>
                                <input type="text" class="form-control" id="files"
                                       placeholder="img*.jpg" v-model="filePattern" required
                                       v-on:keydown.enter="loadFilesMatchingPattern">
                            @else
                                <label>Video(s):</label>
                                <input type="text" class="form-control" id="files"
                                       placeholder="video*.mp4" v-model="filePattern" required
                                       v-on:keydown.enter="loadFilesMatchingPattern">
                            @endif
                            <span class="help-block">
                                Filter by using a pattern that matches specific file names. A pattern may contain the wildcard character * that matches any string of zero or more characters
                            </span>
                            <div class="volume-files-panel">
                                <ul class="list-group files-list">
                                    <li v-for="file in selectedFiles" class="list-group-item"><span
                                            class="text-muted">#<span v-text="file.id"></span></span> <span
                                            v-text="file.filename"></span></li>
                                    <li v-if="noFilesFoundByPattern" class="list-group-item">No files found</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="{{ $errors->has('clone_file_labels') ? ' has-error' : '' }}">
                        <div class="checkbox">
                            <label><input type="checkbox" class="checkbox" id="fileLabels"
                                          v-model="cloneFileLabels" name="clone_file_labels" value="1">
                                <span>Clone file labels</span>
                            </label>
                            @if($errors->has('clone_file_labels'))
                                <span class="help-block">{{ $errors->first('clone_file_labels') }}</span>
                            @endif
                        </div>
                    </div>
                    <div v-if="cloneFileLabels" class="{{ $errors->has('only_file_labels') ? ' has-error' : '' }}" v-cloak>
                        <div class="checkbox">
                            <label><input type="checkbox" class="checkbox" id="filterFileLabels"
                                          v-model="filterFileLabels">
                                Filter file labels (<span v-text="selectedFileLabelsCount"></span> labels selected)
                            </label>
                            @if($errors->has('only_file_labels'))
                                <span class="help-block">{{ $errors->first('only_file_labels') }}</span>
                            @else
                                <span v-if="cloneFileLabels" class="help-block">Clone only a subset of the file labels</span>
                            @endif
                            <label-trees v-if="filterFileLabels" :trees="fileLabelTrees" :multiselect="true"
                                         :allow-select-siblings="true" :allow-select-children="true"
                                         class="request-labels-well well well-sm"></label-trees>
                        </div>
                    </div>
                    <div class="{{ $errors->has('clone_annotations') ? ' has-error' : '' }}">
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" id="annotations" v-model="cloneAnnotations"
                                       name="clone_annotations" value="1">
                                Clone annotations
                            </label>
                            @if($errors->has('clone_annotations'))
                                <span class="help-block">{{ $errors->first('clone_annotations') }}</span>
                            @endif
                        </div>
                    </div>

                    <div v-if="cloneAnnotations" class="{{ $errors->has('only_annotation_labels') ? ' has-error' : '' }}" v-cloak>
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" v-if="cloneAnnotations" id="annotationLabel"
                                       v-model="filterAnnotations"> Filter annotations (<span
                                    v-text="selectedAnnotationLabelsCount"></span> labels selected)
                            </label>
                            @if($errors->has('only_annotation_labels'))
                                <span class="help-block">{{ $errors->first('only_annotation_labels') }}</span>
                            @else
                                <span class="help-block">
                                    Clone only a subset of the annotations
                                </span>
                            @endif
                            <label-trees v-if="cloneAnnotations && filterAnnotations"
                                         :trees="annotationLabelTrees"
                                         :multiselect="true"
                                         :allow-select-siblings="true" :allow-select-children="true"
                                         class="request-labels-well well well-sm" v-cloak></label-trees>
                        </div>
                    </div>
                    <div class="form-group">
                        <span class="pull-right">
                            <a class="btn btn-default" :disabled="loading" type="button"
                               href="{{URL::previous()}}">Cancel</a>
                        <span v-if="showCloneButton">
                            <input type="submit" class="btn btn-success" :disabled="cannotSubmit" value="Clone"></span>
                        <span v-cloak v-else>
                            <button type="button" class="btn btn-success" v-on:click="loadFilesMatchingPattern">Test file query</button>
                        </span>
                        </span>
                        <input v-if="filterAnnotations" v-for="id in selectedAnnotationLabelIds" type="hidden"
                               name="only_annotation_labels[]"
                               v-bind:value="id">
                        <input v-if="filterFileLabels" v-for="id in selectedFileLabelIds" type="hidden"
                               name="only_file_labels[]"
                               v-bind:value="id">
                        <input v-if="filterFiles" v-for="file in selectedFiles" type="hidden" name="only_files[]"
                               v-bind:value="file.id">
                        <input type="hidden" name="_token" value="{{ csrf_token() }}">
                    </div>
                </div>
            </form>
        </div>
    </div>
@endsection
