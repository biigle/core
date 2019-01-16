@extends('app')

@section('title', $video->name)

@section('content')
<div id="video-container" class="video-container">
    <video-screen
        :annotations="annotations"
        :video=video
        v-on:create-bookmark="createBookmark"
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
<script type="text/javascript">
    biigle.$declare('videoSrc', '{{url('api/v1/videos/'.$video->uuid.'/file')}}');
</script>
@endpush

@push('styles')
<link rel="stylesheet" type="text/css" href="{{ cachebust_asset('assets/styles/ol.css') }}">
@endpush
