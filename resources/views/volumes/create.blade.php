@extends('app')

@section('title', 'Create new volume')

@push('scripts')
   <script type="text/javascript">
      biigle.$declare('volumes.name', '{!! old('name') !!}');
      biigle.$declare('volumes.url', '{!! old('url') !!}');
      biigle.$declare('volumes.hadMetadataText', @if (old('metadata_text')) true @else false @endif);
      biigle.$declare('volumes.handle', `{!! old('handle') !!}`);
      biigle.$declare('volumes.mediaType', '{!! $mediaType !!}');
      biigle.$declare('volumes.filenames', '{{ $filenames }}');
      biigle.$declare('volumes.disks', {!! $disks !!});
   </script>
@endpush

@section('content')
<div class="container">
   <div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
      <h2>New volume for {{ $project->name }}</h2>
      <form id="create-volume-form" class="clearfix" role="form" method="POST" action="{{ url('api/v1/projects/'.$project->id.'/volumes') }}" enctype="multipart/form-data" v-on:submit="startLoading">

        <fieldset>
            <legend>
                1. Choose a media type
            </legend>
            <div class="form-group {{ $errors->has('media_type') ? ' has-error' : '' }}">
                <div class="btn-group btn-group-justified">
                    <div class="btn-group">
                        <button type="button" class="btn btn-default" title="Image Volume" v-on:click="selectImageMediaType" :class="{active: isImageMediaType}"><i class="fa fa-image"></i> Image Volume</button>
                    </div>
                    <div class="btn-group">
                        <button type="button" class="btn btn-default" title="Video Volume" v-on:click="selectVideoMediaType" :class="{active: isVideoMediaType}"><i class="fa fa-film"></i> Video Volume</button>
                    </div>
                    <input type="hidden" name="media_type" v-model="mediaType">
                </div>
                @if($errors->has('media_type'))
                   <span class="help-block">{{ $errors->first('media_type') }}</span>
                @endif
            </div>
        </fieldset>

        <fieldset v-if="isImageMediaType">
            <legend>
                2. Choose a name or import from file
            </legend>
            <div class="form-group row{{ $errors->has('name') ? ' has-error' : '' }}">
                <div class="col-sm-8">
                    <input type="text" class="form-control" name="name" id="name" v-model="name" placeholder="My new volume" ref="nameInput" required autofocus>
                    @if($errors->has('name'))
                       <span class="help-block">{{ $errors->first('name') }}</span>
                    @endif
                </div>
                <div class="col-sm-4">
                    <button v-if="hasMetadata" v-cloak type="button" class="btn btn-default btn-block" title="Clear metadata loaded from the selected file" v-on:click="clearMetadata">Clear metadata</button>
                    <dropdown v-else tag="span">
                        <button class="btn {{ $errors->hasAny(['ifdo_file', 'metadata_csv', 'metadata']) ? ' btn-danger' : 'btn-default' }} btn-block dropdown-toggle" type="button" title="Import volume information and metadata from a file" v-bind:disabled="loadingImport"><loader v-bind:active="loadingImport"></loader> Import <span class="caret"></span></button>
                        <template slot="dropdown">
                            <li>
                                 <a title="Import volume information and metadata from an iFDO YAML file" href="#" v-on:click.prevent="importIfdo">iFDO YAML</a>
                            </li>
                            <li>
                                 <a title="Import image metadata from a CSV file" href="#" v-on:click.prevent="importCsv">Metadata CSV</a>
                            </li>
                        </template>
                    </dropdown>

                    <input class="hidden" ref="metadataCsvField" type="file" accept=".csv,text/csv,application/csv" v-on:change="setCsvMetadata">
                    <input class="hidden" ref="metadataIfdoField" type="file" accept=".yml,.yaml" name="ifdo_file" v-on:change="parseIfdoMetadata">
                </div>
            </div>
        </fieldset>
        <fieldset v-else v-cloak>
            <legend>
                2. Choose a name
            </legend>
            <div class="form-group{{ $errors->has('name') ? ' has-error' : '' }}">
                <input type="text" class="form-control" name="name" id="name" value="{{ old('name') }}" placeholder="My new volume" ref="nameInput" required autofocus>
                @if($errors->has('name'))
                   <span class="help-block">{{ $errors->first('name') }}</span>
                @endif
            </div>
        </fieldset>

        <div v-if="isImageMediaType" class="form-group{{ $errors->hasAny(['ifdo_file', 'metadata_csv', 'metadata']) ? ' has-error' : '' }}">

            <p v-if="showImportAgainMessage" v-cloak class="text-danger">Please import the metadata file again.</p>

            <label v-show="hasMetadata" v-cloak for="metadata_text">Metadata (imported from file)</label>
            <textarea v-show="hasMetadata" v-cloak class="form-control" rows="3" name="metadata_text" id="metadata_text" v-model="metadataText" wrap="off" readonly></textarea>

            @if ($errors->hasAny(['ifdo_file', 'metadata_csv', 'metadata']))
                @if ($errors->has('ifdo_file'))
                    <span class="help-block">{{ $errors->first('ifdo_file') }}</span>
                @endif
                @if ($errors->has('metadata_csv'))
                    <span class="help-block">{{ $errors->first('metadata_csv') }}</span>
                @endif
                @if ($errors->has('metadata'))
                    <span class="help-block">{{ $errors->first('metadata') }}</span>
                @endif
            @else
                <span class="help-block">Volume information and metadata can be imported from an <a href="https://marine-imaging.com/fair/ifdos/iFDO-overview/" target="_blank">iFDO YAML</a> file or a <a href="{{route('manual-tutorials', ['volumes', 'image-metadata'])}}" target="_blank">metadata CSV</a> file. Metadata may be overridden by image EXIF information.</span>
            @endif
        </div>

        <fieldset>
            <legend>
                3. Choose a file source
            </legend>
             <div class="form-group">
                <div class="btn-group btn-group-justified">
                    @if($disks->isEmpty())
                        <div class="btn-group">
                            <button type="button" class="btn btn-default active" title="Remote location" disabled><i class="fa fa-link"></i> Remote location</button>
                        </div>
                    @else
                        <div class="btn-group">
                            <button type="button" class="btn btn-default" title="Remote location" v-on:click="selectRemoteFileSource" v-bind:class="{active: isRemoteFileSource}" ><i class="fa fa-link"></i> Remote location</button>
                        </div>
                        @if ($disks->count() > 1)
                            <div class="btn-group">
                                <dropdown tag="span">
                                    <button class="btn btn-default dropdown-toggle" v-bind:class="{active: isDiskFileSource}" type="button" title="Select a storage disk">
                                        <i class="fa fa-database"></i> Storage disk <span class="caret"></span> <loader v-if="initializingBrowser" v-cloak v-bind:active="true"></loader>
                                    </button>
                                    <template slot="dropdown">
                                        @foreach ($disks as $disk)
                                            <li>
                                                 <a title="Choose files from the '{{$disk}}' storage disk" href="#" v-on:click.prevent="selectStorageDisk('{{$disk}}')">{{$disk}}</a>
                                            </li>
                                        @endforeach
                                    </template>
                                </dropdown>
                            </div>
                        @elseif ($disks->count() === 1)
                            <div class="btn-group">
                                <button type="button" class="btn btn-default" title="Choose files from the '{{$disks[0]}}' storage disk" v-on:click="selectStorageDisk('{{$disks[0]}}')" v-bind:class="{active: isDiskFileSource}">
                                    <i class="fa fa-database"></i> Storage disk <loader v-if="initializingBrowser" v-cloak v-bind:active="true"></loader>
                                </button>
                            </div>
                        @endif
                    @endif
                </div>
            </div>
        </fieldset>

        <div v-if="isRemoteFileSource">
            <div class="form-group{{ $errors->has('url') ? ' has-error' : '' }}">
                <label for="url">Remote location URL <a href="{{route('manual-tutorials', ['volumes', 'remote-volumes'])}}" target="_blank" title="Learn more about remote volumes"><i class="fa fa-question-circle"></i></a></label>
                <input type="text" class="form-control" name="url" id="url" placeholder="https://my-domain.tld/volume" required v-model="url" value="{{old('url')}}">
                @if ($errors->has('url'))
                   <span class="help-block">{{ $errors->first('url') }}</span>
                @endif
             </div>

             <div v-if="isImageMediaType" class="panel panel-warning">
                <div class="panel-body text-warning">
                    Remote locations for image volumes must support <a href="/manual/tutorials/volumes/remote-volumes#cors">cross-origin resource sharing</a>.
                </div>
            </div>

             <div class="form-group{{ $errors->has('files') ? ' has-error' : '' }}">
                <label for="files">Volume files</label>
                <div v-if="isImageMediaType" @unless ($mediaType === 'image') v-cloak @endif>
                    <textarea class="form-control" name="files" id="files" placeholder="1.jpg, 2.jpg, 3.jpg" required v-model="filenames" rows="3"></textarea>
                    <p class="help-block">
                       The filenames of the images in the volume directory formatted as comma separated values. Example: <code>1.jpg, 2.jpg, 3.jpg</code>. The supported image file formats are: JPEG, PNG and TIFF.
                    </p>
                    <div v-if="showFilenameWarning" v-cloak class="panel panel-warning">
                        <div class="panel-body text-warning">
                            Most browsers do not support the TIFF format. Only use it for very large images with more than {{config('image.tiles.threshold')}} pixels at one edge, as these will be automatically converted by BIIGLE.
                        </div>
                    </div>
                </div>
                <div v-else @unless ($mediaType === 'video') v-cloak @endif>
                    <textarea class="form-control" name="files" id="files" placeholder="1.mp4, 2.mp4, 3.mp4" required v-model="filenames" rows="3"></textarea>
                    <p class="help-block">
                       The filenames of the videos in the volume directory formatted as comma separated values. Example: <code>1.mp4, 2.mp4, 3.mp4</code>. The supported video file formats are: MP4 (H.264) and WebM (VP8, VP9, AV1).
                    </p>
                </div>
                @if($errors->has('files'))
                   <span class="help-block">{{ $errors->first('files') }}</span>
                @endif
             </div>
        </div>

        <div v-cloak v-if="filenamesReadFromMetadata" class="panel panel-info">
            <div class="panel-body text-info">
                The filenames have been extracted from the provided metadata file.
            </div>
        </div>

        <div v-if="showFileBrowser" v-cloak>
            <p class="help-block">
                Select adirectory below. All files in the directory will be used for the new volume.
            </p>
            <file-browser
                v-bind:root-directory="selectedDiskRoot"
                v-bind:expanded="false"
                v-bind:empty-text="emptyText"
                v-bind:selectable="true"
                v-bind:expand-on-select="true"
                v-on:select="selectDirectory"
                v-on:unselect="unselectDirectory"
                v-on:load="handleLoadDirectory"
                ></file-browser>

            <input type="hidden" name="url" required v-model="url">
            <input type="hidden" name="files" required v-model="filenames">
        </div>

         <fieldset>
             <legend>
                 4. Set a handle or DOI <span class="text-muted">(optional)</span>
             </legend>

             <div class="form-group{{ $errors->has('handle') ? ' has-error' : '' }}">
                <input type="text" class="form-control" name="handle" id="handle" v-model="handle" placeholder="10.3389/fmars.2017.00083">
                <span class="help-block">
                    A <a href="https://handle.net">handle</a> or <a href="https://www.doi.org/">DOI</a> to be associated with the volume.
                </span>
                @if($errors->has('handle'))
                    <span class="help-block">{{ $errors->first('handle') }}</span>
                @endif
            </div>
         </fieldset>

         <div class="form-group">
             <input type="hidden" name="_token" value="{{ csrf_token() }}">
             <input type="hidden" name="_redirect" value="{{ url('projects/'.$project->id) }}">
             <a href="{{ URL::previous() }}" class="btn btn-default" :disabled="loading">Cancel</a>
             <input type="submit" class="btn btn-success pull-right" value="Create" :disabled="loading">
         </div>
      </form>
   </div>
</div>
@endsection
