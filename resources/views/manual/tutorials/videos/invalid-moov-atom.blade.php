@extends('manual.base')

@section('manual-title', 'Invalid Video Moov Atom Position')

@section('manual-content')
<div class="row">
    <p class="lead">
        Fix invalid video moov atom position
    </p>
    <p>
    A video contains a "Moov Atom" in its metadata, which holds information about the video. Videos with the Moov Atom located at the end of the file will not be processed by Biigle. To change the position of the Moov Atom, follow these steps:
    </p>
    <p>
    Download and install the video converting tool <a href="https://www.ffmpeg.org/">FFMPEG</a>.
    </p>
    <p>
    <b>Linux or Mac</b>
    <ol>
        <li>Open a terminal</li>
        <li>Download: <kbd>sudo apt-get install ffmpeg</kbd></li>
        <li>Run: <kbd>ffmpeg -i path/input.mp4 -movflags +faststart path/output.mp4</kbd> </li>
        <li>Use <kbd>output.mp4</kbd> for Biigle upload</li>
    </ol>
    </p>
    <p>
    Check video's moov atom position: <kbd>ffprobe -v trace -i path/input.mp4  2>&1 | grep -o -e type:\'mdat\' -e type:\'moov\'</kbd>
    </p>
    <p>
    If <i>type:'moov'</i> occurs at first, the video's moov atom position is valid.
    </p>
    <p>
    <b>Windows</b>
    <ol>
        <li>Download FFMPEG</li>
        <li>Open cmd</li>
        <li>Run: <kbd>"path\ffmpeg.exe" -i "path\input.mp4" -movflags +faststart "path\output.mp4"
        </kbd> </li>
        <li>Use <kbd>output.mp4</kbd> for Biigle upload</li>
    </ol>
    </p>
        <p>
    Check video's moov atom position: <kbd>"path\ffprobe.exe" -v trace -i "path\input.mp4" 2>&1 | findstr "type:'mdat' type:'moov'"
</kbd>
    </p>
    <p>
    If <i>type:'moov'</i> occurs at first, the video's moov atom position is valid.
    </p>


</div>
@endsection