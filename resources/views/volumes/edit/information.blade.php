<div class="panel panel-default">
    <div class="panel-heading">
        Volume information
    </div>
    <div class="panel-body">
        @if (session('saved'))
            <div class="alert alert-success" role="alert">
                The volume information was successfully updated.
            </div>
        @endif
        @if (session('reread'))
            <div class="alert alert-success" role="alert">
                The volume {{$type}}s are reprocessed.
            </div>
        @endif
        <form role="form" method="POST" action="{{ url('api/v1/volumes/'.$volume->id) }}">
            <div class="row">
                <div class="form-group col-xs-6{{ $errors->has('name') ? ' has-error' : '' }}">
                    <label for="name">Name</label>
                    <input type="text" class="form-control" name="name" id="name" value="{{ old('name', $volume->name) }}" placeholder="My volume" required>
                    @if($errors->has('name'))
                        <span class="help-block">{{ $errors->first('name') }}</span>
                    @endif
                </div>
                <div class="form-group col-xs-6">
                    <label for="media_type">Media Type</label>
                    <span class="form-control" id="media_type" readonly><i class="fa @if ($volume->isImageVolume()) fa-image @else fa-film @endif"></i> {{ucfirst($type)}} Volume</span>
                </div>
            </div>
            <div class="form-group{{ $errors->has('url') ? ' has-error' : '' }}">
                <label for="url">URL</label>
                @if (config('biigle.offline_mode'))
                    <input type="text" class="form-control" name="url" id="url" value="{{ old('url', $volume->url) }}" placeholder="local://images/volume" required>
                @else
                    <input type="text" class="form-control" name="url" id="url" value="{{ old('url', $volume->url) }}" placeholder="https://my-domain.tld/volume" required>
                @endif
                <p class="help-block">
                    @if (config('biigle.offline_mode'))
                      The volume directory on the BIIGLE server (e.g. <code>local://files/volume</code>).
                   @else
                      The volume directory of a <a href="{{route('manual-tutorials', ['volumes', 'remote-volumes'])}}">remote volume</a> (e.g. <code>https://my-domain.tld/volume</code>) or on the BIIGLE server (e.g. <code>local://files/volume</code>).
                   @endif
                </p>
                @if($errors->has('url'))
                    <span class="help-block">{{ $errors->first('url') }}</span>
                @endif
            </div>
            <div class="row">
                <div class="form-group col-xs-12{{ $errors->has('handle') ? ' has-error' : '' }}">
                    <label for="handle">Handle or DOI</label>
                    <input type="text" class="form-control" name="handle" id="handle" value="{{ old('handle', $volume->handle) }}" placeholder="10.1000/xyz123">
                    @if($errors->has('handle'))
                        <span class="help-block">{{ $errors->first('handle') }}</span>
                    @endif
                </div>
            </div>
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <input type="hidden" name="_method" value="PUT">
            <input type="hidden" name="_redirect" value="{{ route('volume-edit', $volume->id) }}">
            <input type="submit" class="btn btn-success" value="Save">
        </form>
    </div>
</div>
