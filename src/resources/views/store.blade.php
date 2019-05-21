@extends('app')

@section('title', 'Create new video')

@push('scripts')
   <script src="{{ cachebust_asset('vendor/videos/scripts/main.js') }}"></script>
@endpush

@push('styles')
   <link href="{{ cachebust_asset('vendor/videos/styles/main.css') }}" rel="stylesheet">
@endpush

@section('content')
<div class="container">
   <div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
      <h2>New video for {{ $project->name }}</h2>
      <form id="create-video-form" class="clearfix" role="form" method="POST" action="{{ url('api/v1/projects/'.$project->id.'/videos') }}" v-on:submit="startLoading">
         <div class="form-group{{ $errors->has('name') ? ' has-error' : '' }}">
            <label for="name">Video name</label>
            <input type="text" class="form-control" name="name" id="name" value="{{ old('name') }}" placeholder="My new video" required>
            @if($errors->has('name'))
               <span class="help-block">{{ $errors->first('name') }}</span>
            @endif
         </div>

         <div class="form-group{{ $errors->has('url') ? ' has-error' : '' }}">
            <label for="url">Video url</label>
            @if (config('biigle.offline_mode'))
                <input type="text" class="form-control" name="url" id="url" placeholder="local://videos/file.mp4" value="{{ old('url') }}" required>
            @else
                <input type="text" class="form-control" name="url" id="url" placeholder="https://my-domain.tld/videos/file.mp4" value="{{ old('url') }}" required>
            @endif
            <p class="help-block">
                @if (config('biigle.offline_mode'))
                  The video file on the BIIGLE server (e.g. <code>local://videos/file.mp4</code>).
               @else
                  The video file of a <a href="{{route('manual-tutorials', ['videos', 'remote-videos'])}}">remote video</a> (e.g. <code>https://my-domain.tld/videos/file.mp4</code>) or on the BIIGLE server (e.g. <code>local://videos/file.mp4</code>).
               @endif
            </p>
            @if($errors->has('url'))
               <span class="help-block">{{ $errors->first('url') }}</span>
            @endif
         </div>

         @unless (config('biigle.offline_mode'))
             <div class="panel panel-warning">
                <div class="panel-body text-warning">
                    If you do not have the resources to host remote videos, <a href="mailto:{{config('biigle.admin_email')}}">contact the admins</a> to discuss the possibility of hosting the videos on the BIIGLE server.
                </div>
            </div>
         @endunless

         <div class="row">
             <div class="form-group col-sm-6{{ $errors->has('doi') ? ' has-error' : '' }}">
                <label for="doi">DOI</label>
                <input type="text" class="form-control" name="doi" id="doi" value="{{ old('doi') }}" placeholder="10.1000/xyz123">
                @if($errors->has('doi'))
                    <span class="help-block">{{ $errors->first('doi') }}</span>
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

         <input type="hidden" name="_token" value="{{ csrf_token() }}">
         <input type="hidden" name="_redirect" value="{{ url('projects/'.$project->id) }}">
         <a href="{{ URL::previous() }}" class="btn btn-link" :disabled="loading">Cancel</a>
         <input type="submit" class="btn btn-success pull-right" value="Create" :disabled="loading">
      </form>
   </div>
</div>
@endsection
