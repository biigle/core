@extends('manual.base')
@section('manual-title', 'Remote Videos')

@section('manual-content')
    <div class="row">
        <p class="lead">
            With remote videos you can use videos from your own data source in BIIGLE.
        </p>

        @if (config('biigle.offline_mode'))
            <div class="panel panel-danger">
                <div class="panel-body text-danger">
                    <strong>This BIIGLE instance is in offline mode.</strong> Remote videos cannot be created if BIIGLE has no working internet connection.
                </div>
            </div>
        @endif

        <p>
            BIIGLE supports loading of videos from remote locations just like it does with <a href="{{route('manual-tutorials', ['volumes', 'remote-volumes'])}}">remote volumes</a> and images. Please refer to the manual article for remote volumes for more details on remote locations in general. You should also read the section on how to <a href="{{route('manual-tutorials', ['volumes', 'remote-volumes'])}}#how-to-secure">secure a remote location</a>.
        </p>

        <p>
            Where the remote volume URL points to a specific directory on a public webserver, a remote video URL should point directly to the video file. Here is an example for a remote video URL: <code>https://your-institute.com/videos/video_001.mp4</code>. The webserver should support <a href="https://developer.mozilla.org/docs/Web/HTTP/Range_requests">HTTP range requests</a> for quicker loading of the video file. Most popular webservers support this out of the box.
        </p>

    </div>
@endsection
