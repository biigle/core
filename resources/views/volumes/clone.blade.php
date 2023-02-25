@extends('app')

@section('title', 'Clone volume')

@push('scripts')
    <script type="text/javascript">
        biigle.$declare('name', '{{$name}}');
        biigle.$declare('destinationProjects', '{!!$destinationProjects!!}');
        biigle.$declare('files', '{!!$files!!}');
        biigle.$declare('volume', '{!!$volume!!}');
        biigle.$declare('labelTrees', '{!!$labelTrees!!}');
    </script>
@endpush

@section('content')
    <div class="container">
        <div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
            <form id="clone-volume-form" class="clearfix" role="form"
                  {{--                  method="POST" action="{{ url('api/v1/volumes/'.($volume->id).'/clone-to/'.$destinationId) }}"--}}
                  enctype="multipart/form-data"
                  v-on:submit="startLoading">
                <fieldset>
                    <legend>
                        1. Change volume name
                    </legend>
                    <div class="form-group">
                        <input type="text" class="form-control" name="name" id="name" v-model="name"
                               placeholder="My new volume name" ref="nameInput" required autofocus>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        2. Select destination
                    </legend>
                    <div>
                        <typeahead class="typeahead--block" :items="getProjects"
                                   placeholder="Select destination project" title="Select project to clone volume to"
                                   v-on:select="setProject" :clear-on-select="true"></typeahead>
                    </div>
                </fieldset>
                <BR>

                <fieldset>
                    <legend>
                        3. Select files
                    </legend>
                </fieldset>

                <input type="checkbox" id="files" v-model="cloneFiles">
                <label>clone files</label>

                <div v-if="cloneFiles">
                <div id="file-panel" class="panel panel-default volume-files-panel">
                    <div class="panel-heading">
                        <div class="form-group">
                            <label>Filename(s):&nbsp;</label>
                            @if ($volume->isImageVolume())
                                <input type="text" class="form-control" id="files"
                                       placeholder="img*.jpg" v-model="filePattern" required v-on:keydown.enter="loadFilesMatchingPattern">
                            @else
                                <input type="text" class="form-control" id="files"
                                       placeholder="video*.mp4" v-model="filePattern" required>
                            @endif
                        </div>
                    </div>
                    <div class="panel-body">
                        <ul class="list-group files-list" v-cloak>
                            <li v-for="file in selectedFiles" class="list-group-item"><span class="text-muted">#<span v-text="file.id"></span></span> <span v-text="file.filename"></span></li>
                        </ul>
                    </div>
                </div>


                <BR>
                <input type="checkbox" id="fileLabels" v-model="cloneFileLabels">
                <label v-if="cloneFiles">clone file Labels</label>
                <label-trees v-if="cloneFileLabels" :trees='{{$labelTrees}}' :multiselect="true" :allow-select-siblings="true" :allow-select-children="true"></label-trees>

                <BR>
                <input type="checkbox" id="annotations" v-model="cloneAnnotations">
                <label v-if="cloneFiles">clone annotations</label>
                <BR>
                <input type="checkbox" v-if="cloneAnnotations" id="annotationLabel"
                       v-model="cloneAnnotationLabels">
                <label v-if="cloneFiles && cloneAnnotations">clone annotation labels</label>

                </div>

            </form>
        </div>
    </div>
@endsection
