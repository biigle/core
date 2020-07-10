<sidebar-tab name="edit" icon="pencil-alt" title="Edit this video">
    @if (session('saved'))
        <div class="alert alert-success" role="alert">
            The video information was updated.
        </div>
    @endif
    <form role="form" method="POST" action="{{ url('api/v1/videos/'.$video->id) }}">
        <div class="form-group{{ $errors->has('name') ? ' has-error' : '' }}">
            <label for="name">Name</label>
            <input type="text" class="form-control" name="name" id="name" value="{{ old('name', $video->name) }}" placeholder="My video" required>
            @if($errors->has('name'))
                <span class="help-block">{{ $errors->first('name') }}</span>
            @endif
        </div>
        <div class="form-group{{ $errors->has('url') ? ' has-error' : '' }}">
            <label for="url">URL</label>
            @if (config('biigle.offline_mode'))
                <input type="text" class="form-control" name="url" id="url" placeholder="local://videos/file.mp4" value="{{ old('url', $video->url) }}" required>
            @else
                <input type="text" class="form-control" name="url" id="url" placeholder="https://my-domain.tld/videos/file.mp4" value="{{ old('url', $video->url) }}" required>
            @endif
            @if($errors->has('url'))
                <p class="help-block">{{ $errors->first('url') }}</p>
            @else
                <p class="help-block">
                    @if (config('biigle.offline_mode'))
                      The video file on the BIIGLE server (e.g. <code>local://videos/file.mp4</code>).
                   @else
                      The video file of a <a href="{{route('manual-tutorials', ['videos', 'remote-videos'])}}">remote video</a> (e.g. <code>https://my-domain.tld/videos/file.mp4</code>) or on the BIIGLE server (e.g. <code>local://videos/file.mp4</code>). Supported video file formats are: MP4 (H.264) and WebM (VP8, VP9, AV1).
                   @endif
                </p>
            @endif
        </div>
        <div class="form-group{{ $errors->has('doi') ? ' has-error' : '' }}">
            <label for="doi">DOI</label>
            <input type="text" class="form-control" name="doi" id="doi" value="{{ old('doi', $video->doi) }}" placeholder="10.1000/xyz123">
            @if($errors->has('doi'))
                <span class="help-block">{{ $errors->first('doi') }}</span>
            @endif
        </div>
        <div class="form-group{{ $errors->has('gis_link') ? ' has-error' : '' }}">
            <label for="gis_link">GIS link</label>
            <input type="text" class="form-control" name="gis_link" id="gis_link" value="{{ old('gis_link', $video->gis_link) }}" placeholder="http://example.com">
            @if($errors->has('gis_link'))
                <span class="help-block">{{ $errors->first('gis_link') }}</span>
            @endif
        </div>
        <input type="hidden" name="_token" value="{{ csrf_token() }}">
        <input type="hidden" name="_method" value="PUT">
        <input type="hidden" name="_redirect" value="{{ route('video', $video->id) }}">
        <input type="submit" class="btn btn-success btn-block" value="Save">
    </form>
</sidebar-tab>
