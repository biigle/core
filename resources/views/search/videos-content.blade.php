@if($type === 'videos')
<h2 class="lead">@if($videoResultCountCapped)more than {{number_format($fileResultCountCap)}}@else{{number_format($videoResultCount)}}@endif video results</h2>
<ul id="search-results" class="row volume-search-results">
    @foreach ($results as $video)
        <li class="col-xs-4">
            <a href="{{route('video-annotate', $video->id)}}" title="Show video {{$video->filename}}">
                <preview-thumbnail class="preview-thumbnail" :id="{{$video->id}}" thumb-uris="{{$video->thumbnailsUrl->implode(',')}}">
                    <img src="{{ $video->thumbnailUrl }}" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
                    <template #caption>
                        <figcaption>{{$video->filename}}</figcaption>
                    </template>
                </preview-thumbnail>
            </a>
        </li>
    @endforeach

    @if ($results->isEmpty())
        <p class="well well-lg text-center">
            @if ($fileQueryTooShort)
                Please use at least {{$minFileQueryLength}} characters to search for videos.
            @else
                We couldn't find any videos
                @if ($query)
                    matching '{{$query}}'.
                @else
                    for you.
                @endif
            @endif
        </p>
    @endif
</ul>

@endif

