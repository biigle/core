@extends('app')

@section('title', $video->name)

@section('content')
<div id="video-container" class="video-container">
    <video-screen :video=video></video-screen>
    {{-- <video controls muted="true"></video> --}}
    <video-timeline v-cloak
        :annotations="annotations"
        :video=video
        v-on:seek="seek"
        ></video-timeline>
</div>
@endsection

@push('scripts')
<script src="{{ cachebust_asset('assets/scripts/ol.js') }}"></script>
<script type="text/javascript">
    biigle.$declare('videoSrc', '{{url('api/v1/videos/'.$video->uuid.'/file')}}');
</script>
@endpush

@push('styles')
<link rel="stylesheet" type="text/css" href="{{ cachebust_asset('assets/styles/ol.css') }}">
@endpush
