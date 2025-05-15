@extends('app')
@section('show-navbar', false)
@section('title', "Annotate {$video->name}")

@section('content')
<div id="video-popup-container" class="video-popup">
    @include('videos.show.content')
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
