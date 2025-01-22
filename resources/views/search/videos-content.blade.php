@if($type === 'videos')
<h2 class="lead">{{number_format($videoResultCount)}} video results</h2>
<ul id="search-results" class="row volume-search-results">
    @foreach ($results as $video)
        <li class="col-xs-4">
            <a href="{{route('video', $video->id)}}" title="Show video {{$video->filename}}">
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
            We couldn't find any videos
            @if ($query)
                matching '{{$query}}'.
            @else
                for you.
            @endif
        </p>
    @endif
</ul>

@endif

