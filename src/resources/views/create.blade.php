@extends('app')

@section('title', 'Create new volume')

@push('scripts')
   <script src="{{ cachebust_asset('vendor/volumes/scripts/main.js') }}"></script>
   <script type="text/javascript">
      biigle.$declare('volumes.url', '{!! old('url') !!}');
      biigle.$declare('volumes.filenames', '{!! str_replace(["\r", "\n"], '', old('images')) !!}');
      @if ($hasBrowser)
         biigle.$declare('volumes.disks', {!! json_encode($disks) !!});
      @endif
   </script>
@endpush

@push('styles')
   <link href="{{ cachebust_asset('vendor/volumes/styles/main.css') }}" rel="stylesheet">
@endpush

@section('content')
<div class="container">
   <div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
      <h2>New volume for {{ $project->name }}</h2>
      <form id="create-volume-form" class="clearfix" role="form" method="POST" action="{{ url('api/v1/projects/'.$project->id.'/volumes') }}" v-on:submit="startLoading">
         <div class="form-group{{ $errors->has('name') ? ' has-error' : '' }}">
            <label for="name">Volume name</label>
            <input type="text" class="form-control" name="name" id="name" value="{{ old('name') }}" placeholder="My new volume" required>
            @if($errors->has('name'))
               <span class="help-block">{{ $errors->first('name') }}</span>
            @endif
         </div>

         <div class="form-group{{ $errors->has('url') ? ' has-error' : '' }}">
            <label for="url">Volume url</label>
            @if ($hasBrowser)
               <div class="input-group">
                  <input type="text" class="form-control" name="url" id="url" placeholder="local://images/volume" required v-model="url">
                  <span class="input-group-btn">
                     <button type="button" class="btn btn-default" v-bind:class="buttonClass" v-on:click="toggleBrowse" title="Open the volume directory browser">browse</button>
                  </span>
               </div>
            @else
               @if (config('biigle.offline_mode'))
                  <input type="text" class="form-control" name="url" id="url" placeholder="local://images/volume" required v-model="url">
               @else
                  <input type="text" class="form-control" name="url" id="url" placeholder="https://my-domain.tld/volume" required v-model="url">
               @endif
            @endif
            <p class="help-block">
               @if (config('biigle.offline_mode'))
                  The volume directory on the BIIGLE server (e.g. <code>local://images/volume</code>).
               @else
                  The volume directory of a <a href="{{route('manual-tutorials', ['volumes', 'remote-volumes'])}}">remote volume</a> (e.g. <code>https://my-domain.tld/volume</code>) or on the BIIGLE server (e.g. <code>local://images/volume</code>).
               @endif
            </p>
            @if($errors->has('url'))
               <span class="help-block">{{ $errors->first('url') }}</span>
            @endif
         </div>

         @if ($hasBrowser)
            <div class="row" v-if="browsing" v-cloak>
               <div v-if="storageDisk" class="col-xs-12">
                  <div class="form-group file-browser">
                     <span class="file-browser__crumbs">
                        <button v-on:click="goBack" type="button" class="btn btn-default btn-xs" title="Go back one directory" v-bind:disabled="!canGoBack"><i class="fa fa-chevron-left"></i></button>
                        <a href="#" v-on:click="goTo(-1)">@{{storageDisk}}</a> :// <span v-for="(crumb, i) in breadCrumbs"><a href="#" v-on:click="goTo(i)" v-text="crumb"></a> / </span>
                        <loader v-bind:active="loadingBrowser"></loader>
                     </span>
                     <div class="list-group file-browser__dirs">
                        <a href="#" v-for="directory in currentDirectories" v-on:click="openDirectory(directory)" class="list-group-item" title="Open this directory">
                           <button type="button" class="btn btn-default btn-xs pull-right" v-on:click.stop="selectDirectory(directory)" v-bind:title="'Select '+directory+' for the new volume'"><i class="fa fa-check"></i></button>
                           @{{directory}}
                        </a>
                        <a v-if="!hasDirectories" href="#" class="list-group-item disabled">
                            <button v-if="hasCurrentDirectory" type="button" class="btn btn-default btn-xs pull-right" v-on:click.stop="selectDirectory()" v-bind:title="'Select '+currentDirectory+' for the new volume'"><i class="fa fa-check"></i></button>
                            No directories
                        </a>
                     </div>
                  </div>
               </div>
               <div v-else class="col-xs-12">
                  <div class="form-group">
                     <label>Storage disk</label>
                     <select v-model="storageDisk" class="form-control">
                        @foreach ($disks as $disk)
                           <option value="{{$disk}}">{{$disk}}</option>
                        @endforeach
                     </select>
                  </div>
               </div>
            </div>
         @endif

         @unless (config('biigle.offline_mode'))
             <div class="panel panel-warning">
                <div class="panel-body text-warning">
                    If you do not have the resources to host images as remote volumes <a href="mailto:{{config('biigle.admin_email')}}">contact the admins</a> to discuss the possibility of hosting the images on the BIIGLE server.
                </div>
            </div>
         @endunless

         <div class="row">
             <div class="form-group col-sm-6{{ $errors->has('media_type_id') ? ' has-error' : '' }}">
                <label for="media_type_id">Volume media type</label>
                <select class="form-control" name="media_type_id" id="media_type_id" required>
                   @foreach($mediaTypes as $mediaType)
                      <option{!! old('media_type_id') == $mediaType->id ? ' selected="selected"' : '' !!} value="{{ $mediaType->id }}">{{ trans('biigle.media_types.'.$mediaType->name) }}</option>
                   @endforeach
                </select>
                @if($errors->has('media_type_id'))
                   <span class="help-block">{{ $errors->first('media_type_id') }}</span>
                @endif
             </div>
             <div class="form-group col-sm-6{{ $errors->has('doi') ? ' has-error' : '' }}">
                <label for="doi">DOI</label>
                <input type="text" class="form-control" name="doi" id="doi" value="{{ old('doi') }}" placeholder="10.1000/xyz123">
                @if($errors->has('doi'))
                    <span class="help-block">{{ $errors->first('doi') }}</span>
                @endif
            </div>
            <div class="form-group col-sm-6{{ $errors->has('video_link') ? ' has-error' : '' }}">
                <label for="video_link">Video link</label>
                <input type="text" class="form-control" name="video_link" id="video_link" value="{{ old('video_link') }}" placeholder="http://video.example.com">
                @if($errors->has('video_link'))
                    <span class="help-block">{{ $errors->first('video_link') }}</span>
                @endif
            </div>
            <div class="form-group col-sm-6{{ $errors->has('gis_link') ? ' has-error' : '' }}">
                <label for="gis_link">GIS link</label>
                <input type="text" class="form-control" name="gis_link" id="gis_link" value="{{ old('gis_link') }}" placeholder="http://gis.example.com">
                @if($errors->has('gis_link'))
                    <span class="help-block">{{ $errors->first('gis_link') }}</span>
                @endif
            </div>
        </div>

         <div class="form-group{{ $errors->has('images') ? ' has-error' : '' }}">
            <label for="images">Volume images</label>
            <textarea class="form-control" name="images" id="images" placeholder="1.jpg, 2.jpg, 3.jpg" required v-model="filenames"></textarea>
            <p class="help-block">
               The filenames of the volume images in the directory of the volume URL formatted as comma separated values. Example: <code>1.jpg, 2.jpg, 3.jpg</code>. The supported image file formats are: JPEG, PNG and TIFF.
            </p>
            <div v-if="showFilenameWarning" v-cloak class="panel panel-warning">
                <div class="panel-body text-warning">
                    Most browsers do not support the TIFF format. Only use it for very large images with more than {{config('image.tiles.threshold')}} pixels at one edge, as these will be automatically converted by BIIGLE.
                </div>
            </div>
            @if($errors->has('images'))
               <span class="help-block">{{ $errors->first('images') }}</span>
            @endif
         </div>

         <input type="hidden" name="_token" value="{{ csrf_token() }}">
         <input type="hidden" name="_redirect" value="{{ url('projects/'.$project->id) }}">
         <a href="{{ URL::previous() }}" class="btn btn-link" :disabled="loading">Cancel</a>
         <input type="submit" class="btn btn-success pull-right" value="Create" :disabled="loading">
      </form>
   </div>
</div>
@endsection
