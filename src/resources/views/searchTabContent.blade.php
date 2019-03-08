@if($type === 'videos')
<?php $videoUrl = Storage::disk(config('videos.thumbnail_storage_disk'))->url(''); ?>
<h2 class="lead">{{number_format($videoResultCount)}} video results</h2>
<ul id="search-results" class="row volume-search-results">
    @foreach ($results as $video)
        <li class="col-xs-4">
            <a href="{{route('video', $video->id)}}" title="Show video {{$video->name}}">
                <video-thumbnail class="volume-thumbnail" uuid="{{$video->uuid}}" :thumb-count="{{config('videos.thumbnail_count')}}" v-bind:tid="{{$video->id}}" uri="{{$videoUrl}}" format="{{config('thumbnails.format')}}">
                    <img src="{{ $videoUrl.'/'.fragment_uuid_path($video->uuid).'/0.'.config('thumbnails.format') }}" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
                    <figcaption slot="caption">{{$video->name}}</figcaption>
                </video-thumbnail>
            </a>
        </li>
    @endforeach

    @if ($results->isEmpty())
        <p class="well well-lg text-center">
            We couldn't find any videos
            @if ($query)
                matching '{{$query}}'.
            @else
                for you.
            @endif
        </p>
    @endif
</ul>

@push('scripts')
<script src="{{ cachebust_asset('vendor/projects/scripts/main.js') }}"></script>
<script src="{{ cachebust_asset('vendor/videos/scripts/main.js') }}"></script>
@endpush

@push('styles')
<link href="{{ cachebust_asset('vendor/projects/styles/main.css') }}" rel="stylesheet">
<link href="{{ cachebust_asset('vendor/volumes/styles/main.css') }}" rel="stylesheet">
@endpush

@endif

