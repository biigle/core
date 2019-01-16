@extends('app')

@section('title', $video->name)

@section('content')
<div id="video-container" class="video-container">
    <video-screen
        :annotations="annotations"
        :video=video
        v-on:create-bookmark="createBookmark"
        v-on:create-annotation="createAnnotation"
        ></video-screen>
    <video-timeline
        :annotations="annotations"
        :video=video
        :bookmarks="bookmarks"
        v-on:seek="seek"
        v-on:select="selectAnnotation"
        v-on:deselect="deselectAnnotations"
        ></video-timeline>
</div>
@endsection

@push('scripts')
@if (app()->environment('local'))
    <script src="{{ cachebust_asset('vendor/annotations/scripts/ol-debug.js') }}"></script>
@else
    <script src="{{ cachebust_asset('vendor/annotations/scripts/ol.js') }}"></script>
@endif
<script src="{{ cachebust_asset('vendor/annotations/scripts/main.js') }}"></script>
<script src="{{ cachebust_asset('vendor/video/scripts/main.js') }}"></script>
<script type="text/javascript">
    biigle.$declare('videoSrc', '{{url('api/v1/videos/'.$video->uuid.'/file')}}');
</script>
@endpush

@push('styles')
<link href="{{ cachebust_asset('vendor/annotations/styles/ol.css') }}" rel="stylesheet">
<link href="{{ cachebust_asset('vendor/video/styles/main.css') }}" rel="stylesheet">
@endpush
