@extends('app')

@section('title', 'clone volume')

@push('scripts')
    <script type="text/javascript">
        biigle.$declare('name', '{{$name}}');
        biigle.$declare('destinationProjects', {!!$destinationProjects!!});
        biigle.$declare('volume', {!!$volume!!});
        biigle.$declare('labelTrees', '{!!$labelTrees!!}');
    </script>
@endpush

@section('content')
    <div class="container">
        <div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
            <div class="form-group">
                <h2 class="row">Clone volume "{!! $volume->name !!}"</h2>
                <br>
            </div>
            <form id="clone-volume-form" class="clearfix" role="form" v-on:submit.prevent="submit"
                  {{--                  method="POST" action="{{ url('api/v1/volumes/'.($volume->id).'/Clone-to/'.$destinationId) }}"--}}
                  enctype="multipart/form-data"
                  v-on:submit="startLoading">
                <div class="row">
                    <div class="form-group">
                        <label>New volume name</label>
                        <input type="text" class="form-control" name="name" id="name" v-model="name"
                               placeholder="My new volume name" ref="nameInput" required autofocus>
                    </div>

                    <div class="form-group">
                        <label>New volume destination project</label>
                        <typeahead class="typeahead--block" :items="getProjects"
                                   placeholder="Select destination project"
                                   title="Select project to clone volume to"
                                   v-on:select="setProject" :clear-on-select="false" required></typeahead>
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
                    <div v-if="cloneFiles">
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
                                               placeholder="video*.mp4" v-model="filePattern" required>
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
                        </div>
                    </div>
                    <div>
                        <div class="checkbox">
                            <label><input type="checkbox" class="checkbox" id="fileLabels"
                                          v-model="cloneFileLabels">
                                @if($volume->isImageVolume())
                                    Clone image labels
                                @else
                                    Clone video labels
                                @endif

                            </label>
                        </div>

                        <div class="checkbox" v-if="cloneFileLabels">
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
                        <label-trees v-if="restrictFileLabels" :trees="fileLabelTrees" :multiselect="true"
                                     :allow-select-siblings="true" :allow-select-children="true"
                                     class="request-labels-well well well-sm"></label-trees>
                    </div>

                    <div class="checkbox">
                        <label>
                            <input type="checkbox" id="annotations" v-model="cloneAnnotations"> Clone
                            annotations
                        </label>
                    </div>

                    <div v-if="cloneAnnotations">
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" v-if="cloneAnnotations" id="annotationLabel"
                                       v-model="restrictAnnotationLabels"> Restrict annotation labels (<span
                                    v-text="selectedAnnotationLabelsCount"></span> labels selected)
                            </label>
                        </div>
                        <label-trees v-if="cloneAnnotations && restrictAnnotationLabels" :trees="annotationLabelTrees"
                                     :multiselect="true"
                                     :allow-select-siblings="true" :allow-select-children="true"
                                     class="request-labels-well well well-sm"></label-trees>
                    </div>
                </div>
                <button class="btn btn-success pull-right" type="button" @click="submit">Submit</button>
                <button class="btn btn-default pull-right" type="button">Cancel</button>
            </form>
        </div>
    </div>
@endsection
