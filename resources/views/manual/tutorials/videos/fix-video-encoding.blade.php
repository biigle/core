@extends('manual.base')

@section('manual-title', 'Fix video encoding')

@section('manual-content')
<div class="row">
    <p class="lead">
        Fix errors in video files that can cause problems in BIIGLE
    </p>
    <p>
        To modify the video files, download and install the tool <a href="https://www.ffmpeg.org/">FFmpeg</a>.
    </p>
    <h3>Fix MP4 moov atom position</h3>
    <p>
        The moov atom of an MP4 file is required by the browser to play the video correctly. If the moov atom is placed at the end of the video file, the entire file must be downloaded first before the video can be played. This can be fixed by moving the moov atom to the beginning of the file.
    </p>
    <p>
        To check the current position of the moov atom in an MP4 file, run the following command.
    </p>
    <p>
        Linux:
<pre>
ffprobe -v trace -i input.mp4  2>&1 | grep -o -e type:\'mdat\' -e type:\'moov\'
</pre>
    </p>
    <p>
        Windows:
<pre>
ffprobe.exe -v trace -i "input.mp4" 2>&1 | findstr "type:'mdat' type:'moov'
</pre>
    </p>
    <p>
        If <code>type:'moov'</code> occurs at first in the command output, the video's moov atom position is valid. Otherwise, fix the position with the command below.
    </p>
    <p>
        Linux:
<pre>
ffmpeg -i input.mp4 -vcodec copy -acodec copy -movflags faststart output.mp4
</pre>
    </p>
    <p>
        Windows:
<pre>
ffmpeg.exe -i "input.mp4" -vcodec copy -acodec copy -movflags faststart "output.mp4"
</pre>
    </p>
    <p>
        The <code>output.mp4</code> file will have the moov atom at the correct position.
    </p>
</div>
@endsection
