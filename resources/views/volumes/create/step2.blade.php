@extends('app')

@section('title', 'Finish creating a new volume')

@push('scripts')
    <script type="text/javascript">
        biigle.$declare('volumes.name', '{!! $oldName !!}');
        biigle.$declare('volumes.url', '{!! $oldUrl !!}');
        biigle.$declare('volumes.handle', `{!! $oldHandle !!}`);
        biigle.$declare('volumes.mediaType', '{!! $mediaType !!}');
        biigle.$declare('volumes.filenames', '{{ $filenames }}');
        biigle.$declare('volumes.filenamesFromMeta', {{ $filenamesFromMeta ? 'true' : 'false' }});
        biigle.$declare('volumes.disks', {!! $disks->keys() !!});
    </script>
@endpush

@section('content')

<div class="container">
    <div id="create-volume-form-step-2" class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
        <h2>New {{$mediaType}} volume for {{ $project->name }}</h2>
        <form method="POST" action="{{ url("api/v1/pending-volumes/{$pv->id}") }}" v-on:submit="startLoading">
            <fieldset>
                <legend>
                    Choose a volume name
                </legend>
                <div class="form-group{{ $errors->has('name') ? ' has-error' : '' }}">
                    <input type="text" class="form-control" name="name" id="name" v-model="name" placeholder="My new volume" ref="nameInput" required autofocus value="{{$oldName}}">
                    @if ($errors->has('name'))
                       <span class="help-block">{{ $errors->first('name') }}</span>
                    @endif
                </div>
            </fieldset>

            <fieldset>
                <legend class="clearfix">
                    Choose a file source
                    <span class="text-muted pull-right">
                        <span v-text="fileCountText">0</span> files
                    </span>
                </legend>
                 <div class="form-group">
                    <div class="btn-group btn-group-justified">
                        @if ($offlineMode && $disks->isEmpty())
                            <div class="panel panel-danger">
                                <div class="panel-body text-danger">
                                    Please configure available storage disks with the <code>VOLUME_ADMIN_STORAGE_DISKS</code> and <code>VOLUME_EDITOR_STORAGE_DISKS</code> environment variables.
                                </div>
                            </div>
                        @endif
                        @unless ($offlineMode)
                            <div class="btn-group">
                                <button v-if="!initialized" type="button" class="btn btn-info active"><i class="fa fa-link"></i> Remote location</button>
                                <button v-cloak type="button" class="btn btn-default" title="Remote location" v-on:click="selectRemoteFileSource" v-bind:class="remoteButtonClass" ><i class="fa fa-link"></i> Remote location</button>
                            </div>
                        @endunless
                        @if ($userDisk)
                            <div class="btn-group">
                                <button type="button" class="btn btn-default" title="Choose files from your uploads" v-on:click="selectStorageDisk('{{$userDisk}}')" v-bind:class="userDiskButtonClass">
                                    <i class="fa fa-upload"></i> Uploaded files
                                </button>
                            </div>
                        @endif
                        @if ($disks->count() > 1)
                            <div class="btn-group">
                                <dropdown tag="span">
                                    <button class="btn btn-default dropdown-toggle" v-bind:class="diskButtonClass" type="button" title="Select a storage disk" style="border-top-left-radius: 0; border-bottom-left-radius: 0;">
                                        <i class="fa fa-database"></i> Storage disk <span class="caret"></span>
                                    </button>
                                    <template slot="dropdown">
                                        @foreach ($disks as $id => $name)
                                            <li>
                                                 <a title="Choose files from the '{{$name}}' storage disk" href="#" v-on:click.prevent="selectStorageDisk('{{$id}}')">{{$name}}</a>
                                            </li>
                                        @endforeach
                                    </template>
                                </dropdown>
                            </div>
                        @elseif ($disks->count() === 1)
                            <div class="btn-group">
                                <button type="button" class="btn btn-default volume-storage-disk-btn" title="Choose files from the '{{$disks->values()->first()}}' storage disk" v-on:click="selectStorageDisk('{{$disks->keys()->first()}}')" v-bind:class="diskButtonClass">
                                    <i class="fa fa-database"></i> {{$disks->values()->first()}}
                                </button>
                            </div>
                        @endif
                    </div>
                </div>
            </fieldset>

            @unless ($offlineMode)
                <div v-if="isRemoteFileSource">
                    <div class="form-group{{ $errors->has('url') ? ' has-error' : '' }}">
                        <label for="url">Remote location URL <a href="{{route('manual-tutorials', ['volumes', 'remote-volumes'])}}" target="_blank" title="Learn more about remote volumes"><i class="fa fa-question-circle"></i></a></label>
                        <input type="text" class="form-control" name="url" id="url" placeholder="https://my-domain.tld/volume" required v-model="url" value="{{$oldUrl}}">
                        @if ($errors->has('url'))
                           <span class="help-block">{{ $errors->first('url') }}</span>
                        @endif
                     </div>

                     @if ($isImageMediaType)
                         <div class="panel panel-warning">
                            <div class="panel-body text-warning">
                                Remote locations for image volumes must support <a href="/manual/tutorials/volumes/remote-volumes#cors">cross-origin resource sharing</a>.
                            </div>
                        </div>
                    @endif

                     <div class="form-group{{ $errors->has('files') ? ' has-error' : '' }}">
                        <label for="files">Volume files</label>
                        @if ($isImageMediaType)
                            <textarea class="form-control" name="files" id="files" placeholder="1.jpg, 2.jpg, 3.jpg" required v-model="filenames" rows="3"></textarea>
                            <p class="help-block">
                               The filenames of the images in the volume directory formatted as comma separated values. Example: <code>1.jpg, 2.jpg, 3.jpg</code>. The supported image file formats are: JPEG, PNG, WebP and TIFF.
                            </p>
                        @else
                            <textarea class="form-control" name="files" id="files" placeholder="1.mp4, 2.mp4, 3.mp4" required v-model="filenames" rows="3"></textarea>
                            <p class="help-block">
                               The filenames of the videos in the volume directory formatted as comma separated values. Example: <code>1.mp4, 2.mp4, 3.mp4</code>. The supported video file formats are: MP4 (H.264) and WebM (VP8, VP9, AV1).
                            </p>
                        @endif
                        @if($errors->has('files'))
                           <span class="help-block">{{ $errors->first('files') }}</span>
                        @endif
                     </div>
                </div>
            @endunless

            <div v-if="showFileBrowser" v-cloak>

                <p v-if="initializingBrowser">
                    <loader v-bind:active="true"></loader> loading available files...
                </p>
                <p v-else class="help-block">
                    <span v-if="storageDiskEmpty" class="text-warning">
                        No files found.
                        @if (Route::has('create-storage-requests'))
                            <a href="{{route('create-storage-requests')}}">Upload new files.</a>
                        @endif
                    </span>
                    <span v-else>
                        Select a directory or files below. All selected files will be used for the new volume.
                    </span>
                    @if ($isImageMediaType)
                        Only files with a supported image file format are shown (JPEG, PNG, WebP and TIFF).
                    @else
                        Only files with a supported video file format are shown (MP4 (H.264) and WebM (VP8, VP9, AV1)).
                    @endif
                </p>

                <file-browser
                    v-if="selectedDiskRoot"
                    v-bind:root-directory="selectedDiskRoot"
                    v-bind:expanded="false"
                    v-bind:empty-text="emptyText"
                    v-bind:selectable="true"
                    v-bind:files-selectable="true"
                    v-bind:expand-on-select="true"
                    v-on:select="selectDirectory"
                    v-on:select-file="selectFile"
                    v-on:unselect="unselectDirectory"
                    v-on:unselect-file="unselectFile"
                    v-on:load="handleLoadDirectory"
                    ></file-browser>


                <input type="hidden" name="url" required v-model="url">
                <input type="hidden" name="files" required v-model="filenames">

                @if ($errors->has('url'))
                    <div class="form-group has-error">
                        <span class="help-block">{{ $errors->first('url') }}</span>
                     </div>
                @endif
                @if ($errors->has('files'))
                    <div class="form-group has-error">
                        <span class="help-block">{{ $errors->first('files') }}</span>
                     </div>
                @endif
            </div>

            <div v-if="showFilenameWarning" v-cloak class="panel panel-warning">
                <div class="panel-body text-warning">
                    Most browsers do not support the TIFF format. Only use it for very large images with more than {{config('image.tiles.threshold')}} pixels at one edge, as these will be automatically converted by BIIGLE.
                </div>
            </div>

            <div v-if="filesDontMatchMetadata" v-cloak class="panel panel-warning">
                <div class="panel-body text-warning">
                    The chosen files could not be found in the uploaded metadata file!
                </div>
            </div>

            <fieldset>
                 <legend>
                     Set a handle or DOI <span class="text-muted">(optional)</span>
                 </legend>

                 <div class="form-group{{ $errors->has('handle') ? ' has-error' : '' }}">
                    <input type="text" class="form-control" name="handle" id="handle" v-model="handle" placeholder="10.3389/fmars.2017.00083" value="{{$oldHandle}}">
                    <span class="help-block">
                        A <a href="https://handle.net">handle</a> or <a href="https://www.doi.org/">DOI</a> to be associated with the volume.
                    </span>
                    @if ($errors->has('handle'))
                        <span class="help-block">{{ $errors->first('handle') }}</span>
                    @endif
                </div>
            </fieldset>

            @if ($hasAnnotations || $hasFileLabels)
                <fieldset>
                     <legend>
                         Import more metadata <span class="text-muted">(optional)</span>
                     </legend>

                     <div class="row">
                        @if ($hasAnnotations)
                             <div class="col-xs-6 form-group{{ $errors->has('import_annotations') ? ' has-error' : '' }}">
                                <button type="button" class="btn btn-default btn-block" v-bind:class="importAnnotationsButtonClass" title="Import annotations after the volume was created" v-on:click="toggleImportAnnotations"><i class="fa fa-map-marker-alt"></i> Import Annotations</button>
                                <input v-if="importAnnotations" type="hidden" name="import_annotations" value="1">
                                @if ($errors->has('import_annotations'))
                                    <span class="help-block">{{ $errors->first('import_annotations') }}</span>
                                @endif
                            </div>
                        @endif

                        @if ($hasFileLabels)
                            <div class="col-xs-6 form-group{{ $errors->has('import_file_labels') ? ' has-error' : '' }}">
                                <button type="button" class="btn btn-default btn-block" v-bind:class="importFileLabelsButtonClass" title="Import file labels after the volume was created" v-on:click="toggleImportFileLabels"><i class="fa fa-tag"></i> Import File Labels</button>
                                <input v-if="importAnnotations" type="hidden" name="import_file_labels" value="1">
                                @if ($errors->has('import_file_labels'))
                                    <span class="help-block">{{ $errors->first('import_file_labels') }}</span>
                                @endif
                            </div>
                        @endif
                     </div>

                    <span class="help-block">
                        If you import more metadata, there will be additional steps after the volume was created.
                    </span>
                </fieldset>
            @endif

            <div class="form-group">
                <input type="hidden" name="_token" value="{{ csrf_token() }}">
                <input type="hidden" name="_method" value="PUT">
                <button type="submit" form="cancel-pending-volume" class="btn btn-default" :disabled="loading" title="Discard data and return to the previous step">Cancel</button>
                <button v-if="!initialized" type="button" class="btn btn-success pull-right" disabled>Create</button>
                <input v-cloak v-if="importAnnotations || importFileLabels" type="submit" class="btn btn-success pull-right" value="Create and continue" :disabled="cannotSubmit" title="Create the volume and continue to import more metadata">
                <input v-cloak v-else type="submit" class="btn btn-success pull-right" value="Create" :disabled="cannotSubmit" title="Create the volume">
            </div>
        </form>
        <form id="cancel-pending-volume" method="POST" action="{{ url("api/v1/pending-volumes/{$pv->id}") }}" v-on:submit="startLoading">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <input type="hidden" name="_method" value="DELETE">
        </form>
    </div>
</div>
@endsection
