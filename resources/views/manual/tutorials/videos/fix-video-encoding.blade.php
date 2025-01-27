@extends('manual.base')

@section('manual-title', 'Fix video encoding')

@section('manual-content')
<div class="row">
    <p class="lead">
        Fix moov atom position
    </p>
    <p>
    Download and install the video converting tool <a href="https://www.ffmpeg.org/">FFMPEG</a>.
    </p>
    <p>
    <b>Linux or MacOS</b>
    <ol>
        <li>Open terminal</li>
        <li>Run: <code>ffmpeg -i path/input.mp4 -vcodec copy -acodec copy -movflags faststart  path/output.mp4</code> </li>
        <li>Use <code>output.mp4</code> for Biigle upload</li>
    </ol>
    </p>
    <p>
    Check video's moov atom position: <code>ffprobe -v trace -i path/input.mp4  2>&1 | grep -o -e type:\'mdat\' -e type:\'moov\'</code>
    </p>
    <p>
    If <code>type:'moov'</code> occurs at first, the video's moov atom position is valid.
    </p>
    <p>
    <b>Windows</b>
    <ol>
        <li>Open cmd</li>
        <li>Run: <code>"path\ffmpeg.exe" -i "path\input.mp4" -vcodec copy -acodec copy -movflags faststart "path\output.mp4"
        </code> </li>
        <li>Use <code>output.mp4</code> for Biigle upload</li>
    </ol>
    </p>
        <p>
    Check video's moov atom position: <code>"path\ffprobe.exe" -v trace -i "path\input.mp4" 2>&1 | findstr "type:'mdat' type:'moov'"
</code>
    </p>
    <p>
    If <code>type:'moov'</code> occurs at first, the video's moov atom position is valid.
    </p>


</div>
@endsection
