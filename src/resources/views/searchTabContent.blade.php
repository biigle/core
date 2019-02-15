@if($type === 'videos')
<h2 class="lead">{{number_format($videoResultCount)}} video results</h2>
<ul class="search-results">
    @foreach ($results as $video)
        <li>
            <small class="pull-right text-muted">Updated on {{$video->updated_at->toFormattedDateString()}}</small>
            <span class="search-results__name">
                <a href="{{route('video', $video->id)}}">{{$video->name}}</a>
            </span>
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
