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

                    <div class="checkbox" v-cloak>
                        <label><input type="checkbox" id="files" v-model="filterFiles">
                            <span v-text="'Filter '+getFileType(false)+'s'"></span>
                            <div class="form-group{{ $errors->has('clone_files') ? ' has-error' : '' }}">
                                @if($errors->has('clone_files'))
                                    <span class="help-block">{{ $errors->first('clone_files') }}</span>
                                @else
                                    <span class="help-block"
                                          v-text="'Check, if only filtered '+getFileType(false)+'s should be cloned'">                                    </span>
                                    <span v-if="filterFiles" class="help-block">
                                        Filter by using a pattern that matches specific file names.<BR>
                                        A pattern may contain the wildcard character * that matches any string of zero or more characters
                                    </span>
                                @endif
                            </div>
                        </label>
                    </div>
                    <div v-if="filterFiles" v-cloak>
                        <div id="file-panel" class="panel panel-default volume-files-panel">
                            <div class="panel-heading">
                                <div class="form-group">
                                    <label v-text="getFileType(true)+'(s):'"></label>
                                    <input v-if="isImageVolume" type="text" class="form-control" id="files"
                                           placeholder="img*.jpg" v-model="filePattern" required
                                           v-on:keydown.enter="loadFilesMatchingPattern">

                                    <input v-else type="text" class="form-control" id="files"
                                           placeholder="video*.mp4" v-model="filePattern" required
                                           v-on:keydown.enter="loadFilesMatchingPattern">
                                </div>
                            </div>
                            <div class="panel-body">
                                <ul class="list-group files-list" v-cloak>
                                    <li v-for="file in selectedFiles" class="list-group-item"><span
                                            class="text-muted">#<span v-text="file.id"></span></span> <span
                                            v-text="file.filename"></span></li>
                                    <li v-if="noFilesFoundByPattern" class="list-group-item">No files found</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div class="checkbox">
                            <div v-cloak>
                                <label><input type="checkbox" class="checkbox" id="fileLabels"
                                              v-model="cloneFileLabels" name="clone_file_labels" value="1">
                                    <span v-text="'Clone '+getFileType(false)+' labels'"></span>
                                    <div class="form-group{{ $errors->has('clone_file_labels') ? ' has-error' : '' }}">
                                        @if($errors->has('clone_file_labels'))
                                            <span class="help-block">{{ $errors->first('clone_file_labels') }}</span>
                                        @else
                                            <span class="help-block"
                                                  v-text="'Check, if '+getFileType(false)+' labels should be cloned too'">
                                    </span>
                                        @endif
                                    </div>
                                </label>
                            </div>

                            <div v-if="cloneFileLabels" v-cloak>
                                <label><input type="checkbox" class="checkbox" id="restrictFileLabels"
                                              v-model="restrictFileLabels">
                                    <span v-text="'Restrict '+getFileType(false)+' labels '+'('+selectedFileLabelsCount+' labels selected)'"></span>
                                    <div class="form-group{{ $errors->has('only_file_labels') ? ' has-error' : '' }}">
                                        @if($errors->has('only_file_labels'))
                                            <span class="help-block">{{ $errors->first('only_file_labels') }}</span>
                                        @else
                                            <span v-if="cloneFileLabels" class="help-block" v-text="'Check, if '+getFileType(false)+' labels should be restricted'"></span>
                                        @endif
                                    </div>

                                </label>
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
                                    Clone annotations
                                    <div class="form-group{{ $errors->has('clone_annotations') ? ' has-error' : '' }}">
                                        @if($errors->has('clone_annotations'))
                                            <span class="help-block">{{ $errors->first('clone_annotations') }}</span>
                                        @else
                                            <span class="help-block">
                                        Check, if annotation labels should be cloned too
                                    </span>
                                        @endif
                                    </div>
                                </label>
                            </div>

                            <div v-if="cloneAnnotationLabels">
                                <div v-cloak>
                                    <label>
                                        <input type="checkbox" v-if="cloneAnnotationLabels" id="annotationLabel"
                                               v-model="restrictAnnotationLabels"> Restrict annotation labels (<span
                                            v-text="selectedAnnotationLabelsCount"></span> labels selected)
                                        <div
                                            class="form-group{{ $errors->has('only_annotation_labels') ? ' has-error' : '' }}">
                                            @if($errors->has('only_annotation_labels'))
                                                <span
                                                    class="help-block">{{ $errors->first('only_annotation_labels') }}</span>
                                            @else
                                                <span v-if="cloneAnnotationLabels" class="help-block">
                                        Check, if annotation labels should be restricted
                                    </span>
                                            @endif
                                        </div>
                                    </label>
                                </div>
                                <label-trees v-if="cloneAnnotationLabels && restrictAnnotationLabels"
                                             :trees="annotationLabelTrees"
                                             :multiselect="true"
                                             :allow-select-siblings="true" :allow-select-children="true"
                                             class="request-labels-well well well-sm"></label-trees>
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
                    <input v-if="restrictAnnotationLabels" v-for="id in selectedAnnotationLabelIds" type="hidden"
                           name="only_annotation_labels[]"
                           v-bind:value="id">
                    <input v-if="restrictFileLabels" v-for="id in selectedFileLabelIds" type="hidden" name="only_file_labels[]"
                           v-bind:value="id">
                    <input v-if="filterFiles" v-for="file in selectedFiles" type="hidden" name="only_files[]"
                           v-bind:value="file.id">
                    <input type="hidden" name="_token" value="{{ csrf_token() }}">
                </div>
            </form>
        </div>
    </div>
@endsection
