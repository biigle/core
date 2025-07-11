@extends('app')
@section('show-navbar', false)
@section('title', "Annotate video")

@section('content')
<div id="video-popup-container">
    <div v-if="parent" class="video-popup">
        @include('videos.show.content')
    </div>
    <screenshot-button
        v-show="false"
        :current-id="videoId"
        :filenames="videoFilenames"
        :ids="videoIds"
        ></screenshot-button>
</div>
@endsection

@push('scripts')
<script type="module">
    biigle.$declare('videos.thumbUri', '{{ $thumbUriTemplate }}');
    biigle.$declare('videos.spritesThumbnailsPerSprite', {!! $spritesThumbnailsPerSprite !!});
    biigle.$declare('videos.spritesThumbnailInterval', {!! $spritesThumbnailInterval !!});
    biigle.$declare('videos.spritesMaxThumbnails', {!! $spritesMaxThumbnails !!});
    biigle.$declare('videos.spritesMinThumbnails', {!! $spritesMinThumbnails !!});
</script>
@endpush
